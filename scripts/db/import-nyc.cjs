const { Client, config } = require("./connection.cjs");
const { createHash, randomUUID } = require("node:crypto");
const { mkdir, writeFile, readFile } = require("node:fs/promises");
const path = require("node:path");
const stable = (s) => {
  const h = createHash("sha256").update(s).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
async function run() {
  const folder = path.resolve(__dirname, "../../database/seeds");
  await mkdir(folder, { recursive: true });
  const file = path.join(folder, "nyc-facilities.json");
  let snapshot;
  if (process.argv.includes("--refresh")) {
    const records = [];
    for (const boro of [
      "MANHATTAN",
      "BROOKLYN",
      "BRONX",
      "QUEENS",
      "STATEN ISLAND",
    ]) {
      const url = new URL(
        "https://data.cityofnewyork.us/resource/ji82-xba5.json",
      );
      url.searchParams.set(
        "$where",
        `boro='${boro}' AND factype IN ('SOUP KITCHEN','FOOD PANTRY','FOOD PANTRY/MEAL SERVICES') AND latitude IS NOT NULL AND longitude IS NOT NULL`,
      );
      url.searchParams.set("$limit", "12");
      url.searchParams.set("$order", "factype DESC,facname,uid");
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw Error("NYC dataset unavailable");
      records.push(...(await response.json()));
    }
    snapshot = {
      retrievedAt: new Date().toISOString(),
      source:
        "https://data.cityofnewyork.us/City-Government/Facilities-Database/ji82-xba5",
      records,
    };
    await writeFile(file, JSON.stringify(snapshot, null, 2) + "\n");
  } else snapshot = JSON.parse(await readFile(file, "utf8"));
  const db = new Client(config);
  await db.connect();
  try {
    await db.query("BEGIN");
    const sid = stable(snapshot.source),
      run = randomUUID(),
      hash = createHash("sha256")
        .update(JSON.stringify(snapshot.records))
        .digest("hex");
    await db.query(
      `INSERT INTO audit.data_sources(id,name,url,license_notes,retrieved_at) VALUES($1,'NYC DCP Facilities Database',$2,'NYC Open Data public dataset. Verify current service details with operator.',$3) ON CONFLICT(url) DO UPDATE SET retrieved_at=EXCLUDED.retrieved_at`,
      [sid, snapshot.source, snapshot.retrievedAt],
    );
    await db.query(
      "INSERT INTO audit.import_runs(id,source_id,status,input_sha256) VALUES($1,$2,'running',$3)",
      [run, sid, hash],
    );
    let accepted = 0,
      rejected = 0;
    const seen = new Set();
    for (const r of snapshot.records) {
      const lat = Number(r.latitude),
        lng = Number(r.longitude),
        key = [r.facname, r.address, r.boro].join("|");
      if (
        !r.uid ||
        !r.facname ||
        !r.address ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < 40.4 ||
        lat > 41 ||
        lng < -74.4 ||
        lng > -73.6 ||
        seen.has(key)
      ) {
        rejected++;
        continue;
      }
      seen.add(key);
      const sourceRecord = stable("nyc-source:" + r.uid),
        pid = stable("nyc-provider:" + key),
        lid = stable("nyc-location:" + key),
        service = stable("nyc-service:" + key + ":" + r.factype);
      await db.query(
        `INSERT INTO audit.source_records(id,source_id,external_id,import_run_id,source_url,content_sha256,raw_record,retrieved_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(source_id,external_id) DO UPDATE SET import_run_id=EXCLUDED.import_run_id,raw_record=EXCLUDED.raw_record,content_sha256=EXCLUDED.content_sha256,retrieved_at=EXCLUDED.retrieved_at`,
        [
          sourceRecord,
          sid,
          r.uid,
          run,
          snapshot.source,
          createHash("sha256").update(JSON.stringify(r)).digest("hex"),
          JSON.stringify(r),
          snapshot.retrievedAt,
        ],
      );
      await db.query(
        `INSERT INTO directory.providers(id,name,data_class,source_record_id) VALUES($1,$2,'public_directory',$3) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,source_record_id=EXCLUDED.source_record_id`,
        [pid, r.facname, sourceRecord],
      );
      await db.query(
        `INSERT INTO directory.locations(id,provider_id,address,borough,postal_code,latitude,longitude,coordinate_source) VALUES($1,$2,$3,$4,$5,$6,$7,'NYC DCP Facilities Database') ON CONFLICT(id) DO UPDATE SET address=EXCLUDED.address,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude`,
        [
          lid,
          pid,
          r.address + ", " + r.boro + ", NY " + (r.zipcode || ""),
          r.boro,
          r.zipcode,
          lat,
          lng,
        ],
      );
      await db.query(
        `INSERT INTO directory.services(id,location_id,service_type,description,source_record_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(location_id,service_type) DO UPDATE SET source_record_id=EXCLUDED.source_record_id`,
        [
          service,
          lid,
          r.factype === "SOUP KITCHEN"
            ? "soup_kitchen"
            : r.factype === "FOOD PANTRY"
              ? "food_pantry"
              : "food_distribution",
          "Publicly listed; hours, eligibility, menus and current availability are unverified. Contact the provider before visiting.",
          sourceRecord,
        ],
      );
      accepted++;
    }
    await db.query(
      "UPDATE audit.import_runs SET status='completed',completed_at=now(),accepted_count=$2,rejected_count=$3 WHERE id=$1",
      [run, accepted, rejected],
    );
    await db.query("COMMIT");
    console.log(
      `NYC directory imported: ${accepted} records; ${rejected} invalid/duplicate records skipped. No partner or live availability claims added.`,
    );
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    await db.end();
  }
}
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
