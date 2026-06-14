const express = require("express");
const cors = require("cors");
const session = require("express-session");
const db = require("./config/db");
const bcrypt = require("bcrypt");
const cron = require("node-cron");
const crypto = require("crypto");
const path = require('path');
require('dotenv').config();

// ─── CRÉATION DE L'APP (doit être avant tout app.use) ────────────────────────
const app = express();
app.set("trust proxy", 1);

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || "hamitouchenada",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(cors({
  origin: ["https://qcmed-1x7m.onrender.com", "http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));

// ─── ROUTES (après app.use middlewares) ──────────────────────────────────────
const authRoutes    = require('./routes/auth.routes');
const profilRoutes  = require('./routes/profil.routes');
const qcmRoutes     = require('./routes/qcm.routes');
const contactRoutes = require('./routes/contact.routes');
const favoriRoutes  = require('./routes/favori.routes');

app.use('/api', authRoutes);
app.use('/api', profilRoutes);
app.use('/api', qcmRoutes);
app.use('/api', contactRoutes);
app.use('/api', favoriRoutes);

// ─── EMAIL ────────────────────────────────────────────────────────────────────
const {
  envoyerEmailsignalemet,
  envoyerEmailMerciUtilisateur,
  envoyerEmailValidation,
  envoyermailcontact
} = require("./email");


// ─── ADMIN — QUESTIONS ────────────────────────────────────────────────────────
app.get('/api/adminquestions', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: "Utilisateur non connecté" });
    }

    const result = await db.query(
      `SELECT id, faculte, module, cours, question, options, correct, image FROM questions ORDER BY id ASC`
    );

    const questions = result.rows.map(r => ({
      id: r.id,
      faculte: r.faculte || "",
      module: r.module || "",
      cours: r.cours || "",
      question: r.question || "",
      options: (() => { try { return JSON.parse(r.options); } catch { return r.options ? [r.options] : []; } })(),
      correct: (() => { try { return JSON.parse(r.correct); } catch { return r.correct ? [r.correct] : []; } })(),
      image: r.image || "",
      state: "unchanged"
    }));

    res.json({ success: true, questions });

  } catch (err) {
    console.error("❌ Erreur SQL /adminquestions :", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/adminquestions', async (req, res) => {
  try {
    const { faculte, module, cours, question, options, correct, image } = req.body;
    const result = await db.query(
      `INSERT INTO questions (faculte, module, cours, question, options, correct, image) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [faculte, module, cours, question, JSON.stringify(options || []), JSON.stringify(correct || []), image || null]
    );
    res.json({ success: true, question: result.rows[0] });
  } catch (err) {
    console.error("❌ Erreur SQL /adminquestions POST :", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/adminquestions', async (req, res) => {
  try {
    const { faculte, module, cours, question, options, correct, image, oldQuestion } = req.body;

    if (!oldQuestion || !question) {
      return res.status(400).json({ success: false, error: "Ancienne ou nouvelle question manquante" });
    }

    const result = await db.query(
      `UPDATE questions SET faculte=$1, module=$2, cours=$3, question=$4, options=$5, correct=$6, image=$7 WHERE question=$8 RETURNING *`,
      [faculte || "", module || "", cours || "", question || "",
       JSON.stringify(options || []), JSON.stringify(correct || []), image || null, oldQuestion]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ success: false, error: "Question introuvable" });

    res.json({ success: true, question: result.rows[0] });

  } catch (err) {
    console.error("❌ Erreur SQL /adminquestions PUT :", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/adminquestions', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, error: "Texte de la question requis" });

    const result = await db.query("DELETE FROM questions WHERE question=$1", [question]);

    if (result.rowCount === 0)
      return res.status(404).json({ success: false, error: "Aucune question trouvée" });

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Erreur SQL /adminquestions DELETE :", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/saveChanges', async (req, res) => {
  const questions = req.body.questions;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ success: false, message: "Format invalide" });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const q of questions) {
      if (q.state === 'new') {
        await client.query(
          `INSERT INTO questions (faculte, module, cours, question, options, correct, image) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [q.faculte || '', q.module || '', q.cours || '', q.question || '',
           JSON.stringify(q.options || []), JSON.stringify(q.correct || []), q.image || null]
        );
      } else if (q.state === 'changed') {
        const oldQ = q.oldQuestion || (q.oldData ? q.oldData.question : null);
        if (!oldQ) throw new Error('❌ Ancienne question manquante pour modification.');

        const result = await client.query(
          `UPDATE questions SET faculte=$1, module=$2, cours=$3, question=$4, options=$5, correct=$6, image=$7 WHERE question=$8`,
          [q.faculte || '', q.module || '', q.cours || '', q.question || '',
           JSON.stringify(q.options || []), JSON.stringify(q.correct || []), q.image || null, oldQ]
        );
        if (result.rowCount === 0) throw new Error(`⚠️ Aucune ligne trouvée pour question="${oldQ}"`);

      } else if (q.state === 'deleted') {
        const target = q.oldQuestion || (q.oldData ? q.oldData.question : q.question);
        if (!target) throw new Error('❌ Question introuvable pour suppression.');
        await client.query('DELETE FROM questions WHERE question=$1', [target]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: '✅ Modifications sauvegardées avec succès' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur /api/saveChanges :', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ─── VALIDATION ANNUELLE (CRON) ───────────────────────────────────────────────
async function getUtilisateurs() {
  const { rows } = await db.query(
    `SELECT id, nom, prenom, email, annee FROM utilisateurs WHERE annee::text NOT LIKE '%7%'`
  );
  return rows;
}

function libelleAnnee(n) {
  const suffix = { 1: "1ère", 2: "2ème", 3: "3ème", 4: "4ème", 5: "5ème", 6: "6ème", 7: "7ème" }[n] || `${n}ème`;
  return `${suffix} Année Médecine`;
}

function getAnneeSuivante(anneeValue) {
  if (typeof anneeValue === 'number') {
    return libelleAnnee(Math.min(anneeValue + 1, 7));
  }

  const match = String(anneeValue || "").match(/\d+/);
  if (!match) return String(anneeValue);
  const n = parseInt(match[0], 10);
  if (Number.isNaN(n)) return String(anneeValue);
  return libelleAnnee(Math.min(n + 1, 7));
}

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

cron.schedule('5 20 6 9 *', async () => {
  console.log("📧 Début envoi email automatique");
  try {
    const utilisateurs = await getUtilisateurs();
    for (const u of utilisateurs) {
      const token = generateToken();
      try {
        await db.query(
          `UPDATE utilisateurs SET token_validation = $1, annee_validated = 0, validation_envoyee = 1 WHERE id = $2`,
          [token, u.id]
        );
        await envoyerEmailValidation(u.email, u.id, u.annee, getAnneeSuivante(u.annee), token);
        console.log(`✅ Email envoyé à ${u.email}`);
      } catch (errUpdate) {
        console.error(`❌ Erreur update token pour utilisateur ${u.id}:`, errUpdate);
      }
    }
  } catch (err) {
    console.error("❌ Erreur récupération utilisateurs :", err);
  }
}, { timezone: 'Africa/Algiers' });

app.post("/api/choix-annee", async (req, res) => {
  const { id, choix, token } = req.body;
  if (!id || !choix || !token) return res.status(400).send("Paramètres manquants");

  try {
    const result = await db.query(
      `SELECT id, annee, email, pseudo, avatar, token_validation, annee_validated, validation_envoyee FROM utilisateurs WHERE id = $1`,
      [id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).send("Utilisateur introuvable");
    if (user.token_validation !== token) return res.status(403).send("Token invalide");
    if (user.annee_validated) return res.json({ success: false, alreadyValidated: true });

    const nouvelleAnnee = (choix === "passe") ? getAnneeSuivante(user.annee) : user.annee;

    await db.query(
      `UPDATE utilisateurs SET annee = $1, annee_validated = TRUE WHERE id = $2`,
      [nouvelleAnnee, id]
    );

    req.session.user = {
      email: user.email,
      annee_validated: true,
      annee: nouvelleAnnee,
      validation_envoyee: user.validation_envoyee,
      id: user.id,
      pseudo: user.pseudo,
      avatar: user.avatar,
    };

    return res.json({ success: true, email: user.email });

  } catch (err) {
    console.error("❌ Erreur PostgreSQL /choix-annee :", err.message);
    return res.status(500).send("Erreur serveur");
  }
});

app.get("/api/check-status", async (req, res) => {
  if (!req.session.user) return res.json({ session: false });

  try {
    const { rows } = await db.query(
      "SELECT annee_validated FROM utilisateurs WHERE id = $1",
      [req.session.user.id]
    );
    return res.json({
      session: true,
      annee_validated: rows[0] ? rows[0].annee_validated === true : false
    });
  } catch (err) {
    console.error("❌ Erreur PostgreSQL /check-status :", err.message);
    return res.status(500).json({ session: true, annee_validated: false });
  }
});

// ─── FRONTEND ─────────────────────────────────────────────────────────────────
const frontend = path.join(__dirname, '../FRONTEND');
app.use(express.static(frontend));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontend, 'ouverture2.html'));
});

// Route catch-all pour les pages HTML uniquement (pas les fichiers statiques)
app.get('*', (req, res) => {
  // Ne pas capturer les requêtes avec une extension de fichier statique
  const ext = path.extname(req.path);
  if (['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.json'].includes(ext)) {
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(frontend, 'ouverture2.html'));
});

// ─── DÉMARRAGE ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});