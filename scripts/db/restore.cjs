const { verify } = require("./verify-backup.cjs");
const [file, targetDatabase] = process.argv.slice(2);
if (!file || !targetDatabase) {
  console.error(
    "Usage: node scripts/db/restore.cjs backup.json new_database_name (existing databases are never overwritten)",
  );
  process.exitCode = 1;
} else
  verify(file, { targetDatabase, keepDatabase: true })
    .then(() =>
      console.log(
        "Restored into the new database. Update POSTGRES_DB only after reviewing the restored copy.",
      ),
    )
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
