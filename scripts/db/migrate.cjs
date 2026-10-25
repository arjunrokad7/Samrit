const { Client, config } = require("./connection.cjs");
const { readFile, readdir } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const path = require("node:path");
async function migrate() {
  const db = new Client(config);
  await db.connect();
  try {
    await db.query("SELECT pg_advisory_lock(82461521)");
    if (
      !(await db.query("SELECT to_regclass('public.\"user\"') AS present"))
        .rows[0].present
    ) {
      await db.query("BEGIN");
      try {
        await db.query(
          await readFile(
            path.resolve(__dirname, "../../database/bootstrap.sql"),
            "utf8",
          ),
        );
        await db.query("COMMIT");
        console.log("Initialized account schema.");
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      }
    }
    await db.query(
      "CREATE TABLE IF NOT EXISTS public.samrit_migrations(name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const folder = path.resolve(__dirname, "../../database/migrations");
    for (const name of (await readdir(folder))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(path.join(folder, name), "utf8"),
        hash = createHash("sha256").update(sql).digest("hex");
      const previous = (
        await db.query(
          "SELECT sha256 FROM public.samrit_migrations WHERE name=$1",
          [name],
        )
      ).rows[0];
      if (previous) {
        if (previous.sha256 !== hash)
          throw Error(`Applied migration changed: ${name}`);
        continue;
      }
      await db.query("BEGIN");
      try {
        await db.query(sql);
        await db.query(
          "INSERT INTO public.samrit_migrations(name,sha256) VALUES($1,$2)",
          [name, hash],
        );
        await db.query("COMMIT");
        console.log("Applied " + name);
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    await db.end();
  }
}
module.exports = { migrate };
if (require.main === module)
  migrate().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
