// BACKEND/db.js
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');
require('dotenv').config();

let db;

if (process.env.DATABASE_URL) {
  // Si DATABASE_URL est défini → on se connecte à PostgreSQL (Neon)
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log("✅ Connecté à PostgreSQL (Neon)");
} else {
  // Sinon → on reste sur SQLite (local)
  db = new sqlite3.Database('qcm.db', (err) => {
    if (err) console.error("❌ Erreur SQLite:", err);
    else console.log("✅ Connecté à SQLite (fichier local)");
  });
}

module.exports = db;
