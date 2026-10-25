const { Client, config } = require("./connection.cjs");
const { mkdir, writeFile, readFile } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const path = require("node:path");
const quote = (value) => '"' + value.replaceAll('"', '""') + '"';
async function backup() {
  const db = new Client(config);
  await db.connect();
  try {
    await db.query("SELECT pg_advisory_lock(82461521)");
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const schemas = (
      await db.query(
        "SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema'",
      )
    ).rows.map((r) => r.nspname);
    const extensions = (
      await db.query(
        "SELECT extname FROM pg_extension WHERE extname<>'plpgsql'",
      )
    ).rows.map((r) => r.extname);
    const enums = (
      await db.query(
        "SELECT n.nspname AS schema,t.typname AS name,array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid GROUP BY n.nspname,t.typname",
      )
    ).rows;
    const tables = [];
    for (const row of (
      await db.query(
        "SELECT schemaname,tablename FROM pg_tables WHERE schemaname = ANY($1) ORDER BY schemaname,tablename",
        [schemas],
      )
    ).rows) {
      const name = `${quote(row.schemaname)}.${quote(row.tablename)}`;
      const columns = (
        await db.query(
          "SELECT a.attname AS name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,pg_get_expr(d.adbin,d.adrelid) AS default_value,t.typname AS base_type FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_type t ON t.oid=a.atttypid LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE n.nspname=$1 AND c.relname=$2 AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum",
          [row.schemaname, row.tablename],
        )
      ).rows;
      const constraints = (
        await db.query(
          "SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=$1::regclass",
          [name],
        )
      ).rows;
      const rows = (await db.query(`SELECT * FROM ${name}`)).rows;
      tables.push({
        schema: row.schemaname,
        name: row.tablename,
        columns,
        constraints,
        rows,
      });
    }
    await db.query("COMMIT");
    let schemaSql;
    if (tables.some((t) => t.schema === "app" && t.name === "domain_records")) {
      const migrationFolder = path.resolve(
        __dirname,
        "../../database/migrations",
      );
      const applied = (
        await db.query(
          "SELECT name,sha256 FROM public.samrit_migrations ORDER BY name",
        )
      ).rows;
      schemaSql = [
        await readFile(
          path.resolve(__dirname, "../../database/bootstrap.sql"),
          "utf8",
        ),
      ];
      for (const migration of applied) {
        const sql = await readFile(
          path.join(migrationFolder, migration.name),
          "utf8",
        );
        if (createHash("sha256").update(sql).digest("hex") !== migration.sha256)
          throw Error("Migration checksum differs; backup aborted");
        schemaSql.push(sql);
      }
    }
    const payload = JSON.stringify({
      format: "samrit-pg-logical-v1",
      database: config.database,
      createdAt: new Date().toISOString(),
      schemas,
      extensions,
      enums,
      tables,
      schemaSql,
    });
    const folder = path.resolve(__dirname, "../../backups");
    await mkdir(folder, { recursive: true });
    const file = path.join(
      folder,
      `before-relational-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    );
    await writeFile(file, payload, { mode: 0o600, flag: "wx" });
    const digest = createHash("sha256").update(payload).digest("hex");
    await writeFile(file + ".sha256", digest + "\n");
    if (
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex") !== digest
    )
      throw Error("Backup checksum verification failed");
    console.log(
      `Verified backup: ${tables.length} tables, ${tables.reduce((n, t) => n + t.rows.length, 0)} rows. Saved under ignored backups/.`,
    );
    return file;
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await db.end();
  }
}
module.exports = { backup };
if (require.main === module)
  backup().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
