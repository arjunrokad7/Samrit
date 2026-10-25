const path = require("node:path");
require("../../backend/node_modules/dotenv").config({
  path: path.resolve(__dirname, "../../backend/.env"),
  quiet: true,
});
const { Client } = require("../../backend/node_modules/pg");
const config = {
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "samrit_db",
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
module.exports = { Client, config };
