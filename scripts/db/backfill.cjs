const path = require("node:path");
process.env.TS_NODE_PROJECT = path.resolve(
  __dirname,
  "../../backend/tsconfig.json",
);
const source = path.resolve(
  __dirname,
  "../../backend/src/database/relational-store.ts",
);
if (require("node:fs").existsSync(source))
  require("../../backend/node_modules/ts-node/register/transpile-only");
const { RelationalStore } = require(
  require("node:fs").existsSync(source)
    ? source
    : path.resolve(
        __dirname,
        "../../backend/dist/backend/src/database/relational-store.js",
      ),
);
const { Client, config } = require("./connection.cjs");
async function backfill() {
  const db = new Client(config);
  await db.connect();
  const manager = {
    query: async (sql, args) => (await db.query(sql, args)).rows,
  };
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(82461520)");
    await db.query("SET CONSTRAINTS ALL DEFERRED");
    if (
      (await db.query("SELECT count(*) FROM app.domain_records")).rows[0]
        .count !== "0"
    ) {
      console.log("Backfill skipped: normalized records already exist.");
      await db.query("ROLLBACK");
      return;
    }
    const records = (
      await db.query(
        "SELECT * FROM samrit_record ORDER BY CASE kind WHEN 'event' THEN 1 WHEN 'center' THEN 2 WHEN 'vehicle' THEN 3 WHEN 'photo' THEN 4 WHEN 'batch' THEN 5 WHEN 'route' THEN 6 ELSE 7 END,\"createdAt\"",
      )
    ).rows;
    const store = new RelationalStore();
    for (const r of records)
      await store.put(r.kind, r.id, r.payload, manager, r.createdAt);
    const count = Number(
      (await db.query("SELECT count(*) FROM app.domain_payloads")).rows[0]
        .count,
    );
    if (count !== records.length)
      throw Error("Migration record count mismatch");
    await db.query("COMMIT");
    console.log(
      `Backfilled and verified ${count} normalized records; original records retained.`,
    );
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    await db.end();
  }
}
module.exports = { backfill };
if (require.main === module)
  backfill().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
