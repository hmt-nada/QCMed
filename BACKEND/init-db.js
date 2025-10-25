// 1. On importe la bibliothèque 'pg' (client PostgreSQL)
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// 2. On crée une connexion vers la base Neon (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // nécessaire sur Render/Neon
});

// 3. On se connecte à la base de données
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Erreur lors de l'ouverture de la base :", err.message);
    return;
  }
  console.log("✅ Base de données ouverte avec succès.");

  // 4. On exécute les requêtes SQL en série
  (async () => {
    try {
      // === Table UTILISATEURS ===
      await client.query(`
        CREATE TABLE IF NOT EXISTS utilisateurs (
          id SERIAL PRIMARY KEY,                 -- identifiant unique auto
          nom TEXT NOT NULL,                     -- nom de l'utilisateur (obligatoire)
          prenom TEXT NOT NULL,                  -- prénom de l'utilisateur (obligatoire)
          email TEXT UNIQUE NOT NULL,            -- email unique (obligatoire)
          mot_de_passe TEXT NOT NULL,            -- mot de passe (obligatoire)
          faculte TEXT,
          annee TEXT,
          pseudo TEXT,                           -- pseudo
          avatar TEXT,                           -- avatar
          email_active BOOLEAN DEFAULT false,
          email_disconnect BOOLEAN DEFAULT false,
          annee_validated BOOLEAN DEFAULT false,
          token_validation TEXT,
          email_pending TEXT,
          validation_envoyee BOOLEAN DEFAULT false
        )
      `);
      console.log("✅ Table 'utilisateurs' créée (ou déjà existante).");

      // === Table VERIFICATIONS_EMAIL ===
      await client.query(`
        CREATE TABLE IF NOT EXISTS verifications_email (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          token TEXT NOT NULL,
          expire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          code TEXT,
          codeExpiration TEXT,
          resend_count INTEGER DEFAULT 0,
          last_resend INTEGER
        )
      `);
      console.log("✅ Table 'verifications_email' créée.");

      // === Table QUESTIONS ===
      await client.query(`
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          faculte TEXT,
          module TEXT,
          cours TEXT,
          question TEXT,
          options JSONB,
          correct JSONB,
          image TEXT
        )
      `);
      console.log("✅ Table 'questions' créée.");

      // === Lecture du fichier JSON ===
      const questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

      // === Préparation de la requête d'insertion ===
      const insertQuery = `
        INSERT INTO questions (faculte, module, cours, question, options, correct, image)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      let remaining = questions.length;

      // === Insertion de chaque question ===
      for (const q of questions) {
        try {
          await client.query(insertQuery, [
            q.faculte,
            q.module,
            q.cours,
            q.question,
            JSON.stringify(q.options),
            JSON.stringify(q.correct),
            q.image
          ]);
          console.log(`✅ Question insérée : "${q.question}"`);
        } catch (err) {
          console.error("❌ Erreur insertion :", err.message);
        }

        // Fermeture après la dernière insertion
        remaining--;
        if (remaining === 0) {
          release();
          await pool.end();
          console.log("✅ Base de données fermée correctement.");
        }
      }
    } catch (err) {
      console.error("❌ Erreur lors de la création des tables :", err.message);
    }
  })();
});
