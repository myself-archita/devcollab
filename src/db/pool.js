const { Pool } = require("pg");

function createPool() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
  const isLocalDatabase =
    !connectionString ||
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  return connectionString
    ? new Pool({
        connectionString,
        ssl: isLocalDatabase ? false : { rejectUnauthorized: false }
      })
    : new Pool({
        host: process.env.PGHOST || "127.0.0.1",
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        database: process.env.PGDATABASE || "devcollab",
        ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false
      });
}

module.exports = { createPool };
