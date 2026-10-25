const { Client, config } = require("./connection.cjs");
const { createHash } = require("node:crypto");
const id = (s) => {
  const h = createHash("sha256").update(s).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
async function run() {
  const db = new Client(config);
  await db.connect();
  try {
    await db.query("BEGIN");
    const url =
        "https://secure.cityharvest.org/site/DocServer/DocServer/DocServer/City_Harvest_By_the_Numbers_Updated_JUL_2024.pdf",
      sid = id(url);
    await db.query(
      `INSERT INTO audit.data_sources(id,name,url,license_notes,retrieved_at,source_updated_at) VALUES($1,'City Harvest By the Numbers, July 2024',$2,'Published organization statistics, stored as dated reference facts; not Samrit fleet inventory.',now(),'2024-07-01') ON CONFLICT(url) DO NOTHING`,
      [sid, url],
    );
    for (const [metric, value, unit] of [
      ["fleet_trucks", 23, "trucks"],
      ["partner_food_programs", 400, "programs"],
      ["food_donors_approximately", 1700, "businesses"],
    ])
      await db.query(
        `INSERT INTO audit.organization_statistics(id,source_id,organization_name,metric,value,unit,as_of,source_page,metadata) VALUES($1,$2,'City Harvest',$3,$4,$5,'2024-07-01','Page 1','{"historical":true,"notAvailableInventory":true,"monthPrecision":true}') ON CONFLICT(source_id,organization_name,metric,as_of) DO NOTHING`,
        [id(url + metric), sid, metric, value, unit],
      );
    await db.query(
      "UPDATE app.domain_records SET data_class='demo' WHERE actor_id IN (SELECT id FROM public.\"user\" WHERE email IN ('donor@example.com','ngo@example.com','volunteer@example.com','driver.maya@example.com','driver.jordan@example.com'))",
    );
    await db.query(
      "UPDATE app.domain_records SET data_class='demo' WHERE kind='vehicle' AND id IN (SELECT id FROM logistics.vehicles WHERE registration LIKE 'DEMO-%')",
    );
    await db.query("COMMIT");
    console.log(
      "Saved 3 historical City Harvest statistics; demo fleet remains separate.",
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
