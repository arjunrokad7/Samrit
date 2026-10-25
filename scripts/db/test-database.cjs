const { Client, config } = require("./connection.cjs");
const { spawnSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const path = require("node:path");
const assert = require("node:assert/strict");
async function run() {
  const admin = new Client({ ...config, database: "postgres" });
  await admin.connect();
  const name = "samrit_schema_test_" + Date.now();
  let db;
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    for (const script of [
      "migrate.cjs",
      "backfill.cjs",
      "seed-catalog.cjs",
      "import-nyc.cjs",
      "seed-statistics.cjs",
      "migrate.cjs",
    ]) {
      const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
        cwd: path.resolve(__dirname, "../.."),
        env: { ...process.env, POSTGRES_DB: name },
        encoding: "utf8",
      });
      if (r.status !== 0) throw Error(script + ": " + r.stderr + r.stdout);
    }
    db = new Client({ ...config, database: name });
    await db.connect();
    let checks = 0;
    const count = async (sql) => Number((await db.query(sql)).rows[0].count);
    assert.equal(
      await count("SELECT count(*) FROM public.samrit_migrations"),
      4,
    );
    checks++;
    assert.equal(
      await count(
        "SELECT count(*) FROM directory.providers WHERE data_class='public_directory'",
      ),
      59,
    );
    checks++;
    assert.equal(
      await count(
        "SELECT count(*) FROM directory.providers WHERE data_class='public_directory' AND partner_verified",
      ),
      0,
    );
    checks++;
    assert.equal(await count("SELECT count(*) FROM logistics.vehicles"), 0);
    checks++;
    assert.equal(await count("SELECT count(*) FROM food.meal_offers"), 3);
    checks++;
    assert.equal(
      await count("SELECT count(*) FROM audit.organization_statistics"),
      3,
    );
    checks++;
    const fails = async (sql, values, pattern) => {
      await assert.rejects(db.query(sql, values), pattern);
      checks++;
    };
    await fails(
      "INSERT INTO directory.providers(id,name,data_class,metadata) VALUES($1,'invalid','demo','[]')",
      [randomUUID()],
      /check constraint/,
    );
    await fails(
      "INSERT INTO directory.locations(id,address,latitude,longitude) VALUES($1,'invalid',91,0)",
      [randomUUID()],
      /check constraint/,
    );
    await fails(
      "INSERT INTO directory.services(id,location_id,service_type) VALUES($1,$2,'food_pantry')",
      [randomUUID(), randomUUID()],
      /foreign key/,
    );
    await fails(
      "INSERT INTO directory.providers(id,name,data_class,metadata) VALUES($1,'invalid','demo',$2)",
      [randomUUID(), JSON.stringify({ notes: "x".repeat(17000) })],
      /check constraint/,
    );
    const entry=(await db.query("SELECT * FROM feedback.venue_qr_codes WHERE phase='entry' LIMIT 1")).rows[0],visit=randomUUID();
    assert.equal(await count("SELECT count(*) FROM feedback.venue_qr_codes WHERE phase='exit' AND active"),0);checks++;
    await db.query("INSERT INTO feedback.visits(id,location_id,secret_hash) VALUES($1,$2,'test-secret-hash')",[visit,entry.location_id]);
    await fails("UPDATE feedback.visits SET finished_at=now() WHERE id=$1",[visit],/check constraint/);
    await db.query("INSERT INTO feedback.visit_scans(id,visit_id,qr_code_id,phase,capture_method) VALUES($1,$2,$3,'entry','manual')",[randomUUID(),visit,entry.id]);
    await db.query("UPDATE feedback.visits SET finished_at=clock_timestamp(),completion_method='button' WHERE id=$1",[visit]);checks++;
    await fails("INSERT INTO feedback.visit_scans(id,visit_id,qr_code_id,phase,capture_method) VALUES($1,$2,$3,'entry','manual')",[randomUUID(),visit,entry.id],/unique constraint/);
    console.log(
      `PASS: ${checks} isolated database checks, clean install, repeatable migrations, provenance, metadata, foreign keys and visit integrity.`,
    );
  } finally {
    if (db) await db.end();
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
    await admin.end();
  }
}
run().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
