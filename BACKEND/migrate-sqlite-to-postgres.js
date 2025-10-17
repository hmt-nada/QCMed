

const sqlite3 = require("sqlite3").verbose();
const { Client } = require("pg");

// 🗂️ Ton fichier SQLite local
const sqliteDbPath = "./qcm.db";

// 🌐 Chaîne de connexion Neon (remplace ici ta vraie URL)
const pgClient = new Client({
  connectionString: "postgresql://neondb_owner:npg_mIMHY5Bg0Xxj@ep-nameless-fog-adq89kgb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

pgClient.connect();

const sqliteDb = new sqlite3.Database(sqliteDbPath);

async function migrate() {
  try {
    console.log("🚀 Début de la migration...");

    // --- Création des tables dans PostgreSQL ---
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        mot_de_passe TEXT NOT NULL,
        faculte TEXT,
        annee TEXT,
        pseudo TEXT,
        avatar TEXT,
        email_active BOOLEAN DEFAULT false,
        email_disconnect BOOLEAN DEFAULT false,
        annee_validated BOOLEAN DEFAULT false,
        token_validation TEXT,
        email_pending TEXT,
        validation_envoyee BOOLEAN DEFAULT false
      )
    `);

    await pgClient.query(`
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

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        faculte TEXT,
        module TEXT,
        cours TEXT,
        question TEXT,
        options TEXT,
        correct TEXT,
        image TEXT
      )
    `);

    console.log("✅ Tables créées sur Neon.");

    // --- Migration des données depuis SQLite ---
    await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM utilisateurs", async (err, rows) => {
        if (err) return reject(err);
        for (const row of rows) {
          await pgClient.query(
            `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, faculte, annee, pseudo, avatar, email_active, email_disconnect, annee_validated, token_validation, email_pending, validation_envoyee)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
            [
              row.nom,
              row.prenom,
              row.email,
              row.mot_de_passe,
              row.faculte,
              row.annee,
              row.pseudo,
              row.avatar,
              row.email_active,
              row.email_disconnect,
              row.annee_validated,
              row.token_validation,
              row.email_pending,
              row.validation_envoyee,
            ]
          );
        }
        console.log("✅ utilisateurs migrés.");
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM verifications_email", async (err, rows) => {
        if (err) return reject(err);
        for (const row of rows) {
          await pgClient.query(
            `INSERT INTO verifications_email (email, token, expire, code, codeExpiration, resend_count, last_resend)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              row.email,
              row.token,
              row.expire,
              row.code,
              row.codeExpiration,
              row.resend_count,
              row.last_resend,
            ]
          );
        }
        console.log("✅ verifications_email migrés.");
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM questions", async (err, rows) => {
        if (err) return reject(err);
        for (const row of rows) {
          await pgClient.query(
            `INSERT INTO questions (faculte, module, cours, question, options, correct, image)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              row.faculte,
              row.module,
              row.cours,
              row.question,
              row.options,
              row.correct,
              row.image,
            ]
          );
        }
        console.log("✅ questions migrées.");
        resolve();
      });
    });

    console.log("🎉 Migration terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur durant la migration :", error);
  } finally {
    sqliteDb.close();
    pgClient.end();
  }
}

migrate();
