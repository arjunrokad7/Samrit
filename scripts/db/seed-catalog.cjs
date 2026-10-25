const path = require("node:path");
process.env.TS_NODE_PROJECT = path.resolve(
  __dirname,
  "../../backend/tsconfig.json",
);
require("../../backend/node_modules/ts-node/register/transpile-only");
const { CONSUMER_MEALS } = require("../../shared/types/consumer-meals.ts");
const { stableId } = require("../../backend/src/database/relational-store.ts");
const { Client, config } = require("./connection.cjs");
const { createHash } = require("node:crypto");
async function run() {
  const db = new Client(config);
  await db.connect();
  try {
    await db.query("BEGIN");
    for (const m of CONSUMER_MEALS) {
      const pid = stableId("demo-provider:" + m.id),
        lid = stableId("demo-location:" + m.id);
      await db.query(
        "INSERT INTO directory.providers(id,name,data_class,metadata) VALUES($1,$2,'demo','{\"fictional\":true}') ON CONFLICT(id) DO NOTHING",
        [pid, m.name],
      );
      await db.query(
        "INSERT INTO directory.locations(id,provider_id,address,latitude,longitude,coordinate_source) VALUES($1,$2,$3,$4,$5,'fictional_demo') ON CONFLICT(id) DO NOTHING",
        [lid, pid, m.address, m.lat, m.lng],
      );
      await db.query(
        "INSERT INTO food.meal_offers(id,location_id,name,description,serving_temperature,dietary_tags,allergens,data_class,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,'demo',$8) ON CONFLICT(id) DO UPDATE SET description=EXCLUDED.description,serving_temperature=EXCLUDED.serving_temperature",
        [
          stableId("demo-meal:" + m.id),
          lid,
          m.meal,
          m.description,
          m.servingTemperature,
          m.dietaryTags,
          m.allergens,
          JSON.stringify({
            slug: m.id,
            distance: m.distance,
            hours: m.hours,
            fictional: true,
          }),
        ],
      );
      for (const phase of ["entry"]) {
        const token = `samrit:visit:${m.id}:${phase}`;
        await db.query(
          "INSERT INTO feedback.venue_qr_codes(id,location_id,phase,token_hash) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
          [
            stableId("demo-qr:" + token),
            lid,
            phase,
            createHash("sha256").update(token).digest("hex"),
          ],
        );
      }
    }
    await db.query("COMMIT");
    console.log("Seeded 3 fictional meal locations and paired demo QR codes.");
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
