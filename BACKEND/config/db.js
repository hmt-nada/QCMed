// BACKEND/db.js
const { Pool } = require("pg");
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

db.connect()
  .then(() => console.log("✅ Connecté à PostgreSQL (Neon)"))
  .catch(err => console.error("❌ Erreur de connexion PostgreSQL :", err));

module.exports = db;
