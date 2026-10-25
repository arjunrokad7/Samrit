const { Client, config } = require("./connection.cjs");
const { readFile } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const q = (s) => '"' + s.replaceAll('"', '""') + '"';
async function verify(file, options = {}) {
  const data = await readFile(file, "utf8");
  const expected = (await readFile(file + ".sha256", "utf8")).trim();
  if (createHash("sha256").update(data).digest("hex") !== expected)
    throw Error("Backup checksum mismatch");
  const snapshot = JSON.parse(data);
  const name = options.targetDatabase || "samrit_restore_check_" + Date.now();
  if (!/^[a-z][a-z0-9_]{1,62}$/.test(name))
    throw Error(
      "Use a new database name containing lowercase letters, numbers and underscores.",
    );
  const admin = new Client({ ...config, database: "postgres" });
  await admin.connect();
  let db,
    created = false,
    passed = false;
  try {
    await admin.query(`CREATE DATABASE ${q(name)}`);
    created = true;
    db = new Client({ ...config, database: name });
    await db.connect();
    if (snapshot.schemaSql) {
      for (const sql of snapshot.schemaSql) await db.query(sql);
      await db.query(
        "CREATE TABLE public.samrit_migrations(name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
      );
      await db.query("BEGIN");
      await db.query("SET LOCAL session_replication_role=replica");
      const names = snapshot.tables.map((t) => `${q(t.schema)}.${q(t.name)}`);
      await db.query(`TRUNCATE ${names.join(",")} CASCADE`);
      const foreign = [];
      for (const t of snapshot.tables)
        for (const c of t.constraints.filter((c) =>
          c.definition.startsWith("FOREIGN KEY"),
        )) {
          const table = `${q(t.schema)}.${q(t.name)}`;
          await db.query(
            `ALTER TABLE ${table} DROP CONSTRAINT ${q(c.conname)}`,
          );
          foreign.push({ table, ...c });
        }
      for (const t of snapshot.tables) {
        const table = `${q(t.schema)}.${q(t.name)}`;
        for (const row of t.rows)
          await db.query(
            `INSERT INTO ${table} (${t.columns.map((c) => q(c.name)).join(",")}) OVERRIDING SYSTEM VALUE VALUES (${t.columns.map((_, i) => "$" + (i + 1)).join(",")})`,
            t.columns.map((c) =>
              ["json", "jsonb"].includes(c.base_type) && row[c.name] !== null
                ? JSON.stringify(row[c.name])
                : row[c.name],
            ),
          );
      }
      for (const c of foreign)
        await db.query(
          `ALTER TABLE ${c.table} ADD CONSTRAINT ${q(c.conname)} ${c.definition}`,
        );
      for (const t of snapshot.tables) {
        const table = `${q(t.schema)}.${q(t.name)}`;
        for (const c of t.columns) {
          const sequence = (
            await db.query("SELECT pg_get_serial_sequence($1,$2) AS name", [
              table,
              c.name,
            ])
          ).rows[0].name;
          if (sequence)
            await db.query(
              `SELECT setval($1,coalesce((SELECT max(${q(c.name)}) FROM ${table}),1),(SELECT count(*)>0 FROM ${table}))`,
              [sequence],
            );
        }
        const count = (await db.query(`SELECT count(*) FROM ${table}`)).rows[0]
          .count;
        if (Number(count) !== t.rows.length)
          throw Error("Restored row count differs");
      }
      await db.query("COMMIT");
      passed = true;
      console.log(
        `Isolated full-schema restore verified: ${snapshot.tables.length} tables, all foreign keys, row counts and sequences passed.`,
      );
      return;
    }
    for (const s of snapshot.schemas)
      await db.query(`CREATE SCHEMA IF NOT EXISTS ${q(s)}`);
    for (const e of snapshot.extensions)
      await db.query(`CREATE EXTENSION IF NOT EXISTS ${q(e)}`);
    for (const e of snapshot.enums)
      await db.query(
        `CREATE TYPE ${q(e.schema)}.${q(e.name)} AS ENUM (${(Array.isArray(e.labels) ? e.labels : e.labels.slice(1, -1).split(",")).map((v) => "'" + v.replaceAll("'", "''") + "'").join(",")})`,
      );
    for (const t of snapshot.tables) {
      const table = `${q(t.schema)}.${q(t.name)}`;
      await db.query(
        `CREATE TABLE ${table} (${t.columns.map((c) => `${q(c.name)} ${c.type}${c.default_value ? " DEFAULT " + c.default_value : ""}${c.not_null ? " NOT NULL" : ""}`).join(",")})`,
      );
      for (const row of t.rows)
        await db.query(
          `INSERT INTO ${table} (${t.columns.map((c) => q(c.name)).join(",")}) VALUES (${t.columns.map((_, i) => "$" + (i + 1)).join(",")})`,
          t.columns.map((c) =>
            ["json", "jsonb"].includes(c.base_type) && row[c.name] !== null
              ? JSON.stringify(row[c.name])
              : row[c.name],
          ),
        );
    }
    for (const t of snapshot.tables)
      for (const c of t.constraints.filter(
        (c) => !c.definition.startsWith("FOREIGN KEY"),
      ))
        await db.query(
          `ALTER TABLE ${q(t.schema)}.${q(t.name)} ADD CONSTRAINT ${q(c.conname)} ${c.definition}`,
        );
    for (const t of snapshot.tables)
      for (const c of t.constraints.filter((c) =>
        c.definition.startsWith("FOREIGN KEY"),
      ))
        await db.query(
          `ALTER TABLE ${q(t.schema)}.${q(t.name)} ADD CONSTRAINT ${q(c.conname)} ${c.definition}`,
        );
    for (const t of snapshot.tables) {
      const count = (
        await db.query(`SELECT count(*) FROM ${q(t.schema)}.${q(t.name)}`)
      ).rows[0].count;
      if (Number(count) !== t.rows.length)
        throw Error("Restore row count differs");
    }
    passed = true;
    console.log(
      `Isolated restore verified: ${snapshot.tables.length} tables; all row counts and constraints passed.`,
    );
  } finally {
    if (db) await db.end();
    if (created && !(options.keepDatabase && passed))
      await admin.query(`DROP DATABASE ${q(name)}`);
    await admin.end();
  }
}
module.exports = { verify };
if (require.main === module)
  verify(process.argv[2]).catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
