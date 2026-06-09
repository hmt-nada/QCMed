const express = require("express");
const cors = require("cors");
const session = require("express-session");
const db = require("./db");
const bcrypt = require("bcrypt");
const cron = require("node-cron");
const crypto = require("crypto");
require('dotenv').config();

const {
  envoyerEmailsignalemet,
  envoyerEmailMerciUtilisateur,
  envoyerEmailValidation,
  envoyermailcontact
} = require("./email");

const app = express();
app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET || "hamitouchenada",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24h
  },
}));

app.use(cors({
  origin: ["https://qcmed-1x7m.onrender.com"],
  credentials: true
}));

app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));


// ─── INSCRIPTION ──────────────────────────────────────────────────────────────
// MODIFIÉ : email_active = true directement, token_validation = NULL,
//           plus de génération de token, compte actif immédiatement
app.post('/api/inscription', async (req, res) => {
  const { nom, prenom, faculte, annee, email, password } = req.body;

  try {
    const checkQuery = "SELECT * FROM utilisateurs WHERE email = $1";
    const checkResult = await db.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      return res.json({ success: false, message: "Email déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO utilisateurs 
      (nom, prenom, faculte, annee, email, mot_de_passe, email_active, email_disconnect, annee_validated, token_validation, validation_envoyee)
      VALUES ($1, $2, $3, $4, $5, $6, true, false, true, NULL, false)
      RETURNING id;
    `;

    const insertResult = await db.query(insertQuery, [
      nom,
      prenom,
      faculte,
      annee,
      email,
      hashedPassword
    ]);

    console.log("✅ Utilisateur ajouté avec ID :", insertResult.rows[0].id);
    return res.json({ success: true, message: `Bienvenue ${nom}, inscription réussie !` });

  } catch (error) {
    console.error("❌ Erreur durant l'inscription :", error.message);
    return res.status(500).json({ success: false, message: "Erreur lors de l'inscription." });
  }
});


// ─── PSEUDO / AVATAR ──────────────────────────────────────────────────────────
// MODIFIÉ : suppression de la génération de token et de l'envoi d'email de confirmation.
//           La mise à jour du pseudo/avatar est immédiate et définitive.
// DANS /api/pseudo — APRÈS la mise à jour en base, AVANT le res.json
app.post('/api/pseudo', async (req, res) => {
  const { pseudo, avatar, email } = req.body;

  try {
    const updateQuery = `
      UPDATE utilisateurs
      SET pseudo = $1, avatar = $2
      WHERE email = $3
      RETURNING id
    `;
    const result = await db.query(updateQuery, [pseudo, avatar, email]);

    if (result.rowCount === 0) {
      return res.json({ success: false, message: "Utilisateur non trouvé." });
    }

    // ✅ AJOUT : récupérer les infos complètes et créer la session
    const getUserQuery = `
      SELECT id, email, pseudo, avatar, annee, annee_validated, validation_envoyee
      FROM utilisateurs WHERE email = $1
    `;
    const userData = await db.query(getUserQuery, [email]);
    const utilisateur = userData.rows[0];

    const role = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase()) ? "admin" : "user";

    req.session.user = {
      id: utilisateur.id,
      email: utilisateur.email,
      pseudo: utilisateur.pseudo,
      avatar: utilisateur.avatar,
      annee: utilisateur.annee,
      annee_validated: utilisateur.annee_validated,
      validation_envoyee: utilisateur.validation_envoyee,
      role: role
    };

    return res.json({ success: true, message: "Pseudo et avatar mis à jour avec succès." });

  } catch (err) {
    console.error("❌ Erreur dans /api/pseudo :", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ─── ENVOI CODE (récupération de compte) ──────────────────────────────────────
// MODIFIÉ : suppression du filtre AND email_active = TRUE.
//           Tous les utilisateurs existants peuvent récupérer leur compte.
app.post('/api/envoyer-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 90_000);

  try {
    const userQuery = `SELECT * FROM utilisateurs WHERE email = $1`;
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const checkQuery = `SELECT * FROM verifications_email WHERE email = $1`;
    const checkResult = await db.query(checkQuery, [email]);

    if (checkResult.rowCount > 0) {
      const updateQuery = `
        UPDATE verifications_email
        SET code = $1, codeexpiration = $2
        WHERE email = $3
      `;
      await db.query(updateQuery, [code, expiration, email]);
    } else {
      const insertQuery = `
        INSERT INTO verifications_email (email, code, codeexpiration)
        VALUES ($1, $2, $3)
      `;
      await db.query(insertQuery, [email, code, expiration]);
    }

    const { envoyerEmailConfirmationcode } = require("./email");
    await envoyerEmailConfirmationcode(email, code);

    res.json({ success: true, message: "Email envoyé avec succès." });

  } catch (err) {
    console.error("❌ Erreur dans /api/envoyer-code :", err.message);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'envoi du code." });
  }
});


// ─── VÉRIFICATION CODE (récupération de compte) ───────────────────────────────
// NON MODIFIÉ : cette route sert à la récupération de mot de passe, on la garde intacte.
app.post('/api/verifier-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    const query = `SELECT * FROM verifications_email WHERE email = $1`;
    const result = await db.query(query, [email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }

    const user = result.rows[0];

    if (user.code !== code) {
      return res.json({ success: false, message: "Code incorrect." });
    }

    const expirationDate = new Date(user.codeexpiration);
    const maintenant = new Date();

    if (maintenant > expirationDate) {
      await db.query(
        `UPDATE verifications_email SET code = NULL, codeexpiration = NULL WHERE email = $1`,
        [email]
      );
      return res.json({ success: false, message: "Code expiré." });
    }

    await db.query(
      `UPDATE verifications_email SET code = NULL, codeexpiration = NULL WHERE email = $1`,
      [email]
    );

    return res.json({ success: true, message: "Code valide." });

  } catch (err) {
    console.error("❌ Erreur dans /api/verifier-code :", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});


// ─── CONNEXION ────────────────────────────────────────────────────────────────
// MODIFIÉ : suppression du filtre AND email_active = TRUE.
//           Tout utilisateur enregistré peut se connecter immédiatement.
const ADMIN_EMAILS = ["on_hamitouche@esi.dz", "hamziakramdjouad@gmail.com", "zailalmehdi20@gmail.com"];

app.post("/api/connexion", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM utilisateurs WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const role = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase()) ? "admin" : "user";

    await db.query(
      "UPDATE utilisateurs SET email_disconnect = FALSE WHERE email = $1",
      [email]
    );

    const userData = await db.query(
      `SELECT id, email, pseudo, avatar, annee, annee_validated FROM utilisateurs WHERE email = $1`,
      [email]
    );

    const utilisateur = userData.rows[0];
    if (!utilisateur) {
      return res.status(500).send("Impossible de charger l'utilisateur.");
    }

    req.session.user = {
      id: utilisateur.id,
      annee_validated: utilisateur.annee_validated,
      validation_envoyee: utilisateur.validation_envoyee,
      email: utilisateur.email,
      pseudo: utilisateur.pseudo,
      avatar: utilisateur.avatar,
      role: role,
      annee: utilisateur.annee
    };

    console.log(`✅ Utilisateur ${email} connecté`);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      utilisateur: req.session.user
    });

  } catch (err) {
    console.error("❌ Erreur dans /api/connexion :", err);
    return res.status(500).json({ error: "Erreur interne lors de la connexion" });
  }
});


// ─── DÉCONNEXION ──────────────────────────────────────────────────────────────
app.post("/api/deconnexion", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ success: true, message: "Pas de session active." });
    }

    const emailUser = req.session.user.email;

    await db.query(
      "UPDATE utilisateurs SET email_disconnect = TRUE WHERE email = $1",
      [emailUser]
    );

    delete req.session.user;
    res.clearCookie("connect.sid");

    console.log(`✅ Utilisateur ${emailUser} déconnecté`);
    return res.json({ success: true, message: "Déconnexion réussie." });

  } catch (err) {
    console.error("❌ Erreur update email_disconnect :", err);
    return res.status(500).json({ error: "Erreur lors de la mise à jour de la déconnexion." });
  }
});


// ─── SUPPRESSION DU COMPTE ────────────────────────────────────────────────────
app.delete("/api/suppression", async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.session.user?.email;

    if (!email) {
      return res.status(401).json({ error: "Aucune session active." });
    }

    const result = await db.query("SELECT * FROM utilisateurs WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    await db.query("DELETE FROM utilisateurs WHERE email = $1", [email]);

    if (req.session.user) {
      req.session.destroy(err => {
        if (err) {
          console.error("Erreur suppression session :", err);
          return res.status(500).json({ error: "Erreur lors de la suppression de la session." });
        }
        res.clearCookie("connect.sid");
        console.log(`🗑️ Compte ${email} supprimé avec succès.`);
        return res.json({ message: "Compte supprimé et déconnecté avec succès." });
      });
    } else {
      return res.json({ message: "Compte supprimé avec succès." });
    }

  } catch (err) {
    console.error("🔥 Erreur lors de la suppression :", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// ─── CHANGEMENT DE MOT DE PASSE ───────────────────────────────────────────────
app.post("/api/change-password", async (req, res) => {
  const email = req.session.user?.email;
  if (!email) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const userResult = await db.query("SELECT mot_de_passe FROM utilisateurs WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(currentPassword, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateResult = await db.query(
      "UPDATE utilisateurs SET mot_de_passe = $1 WHERE email = $2 RETURNING email",
      [hashedNewPassword, email]
    );

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ error: "Erreur de mise à jour." });
    }

    return res.status(200).json({ message: "Mot de passe changé avec succès." });

  } catch (err) {
    console.error("Erreur changement mot de passe :", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// ─── NOUVEAU MOT DE PASSE (récupération de compte) ───────────────────────────
app.post("/api/new-password", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await db.query("SELECT * FROM utilisateurs WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const user = userResult.rows[0];
    const hashedNewPassword = await bcrypt.hash(password, 10);

    const updateQuery = `
      UPDATE utilisateurs
      SET mot_de_passe = $1, email_disconnect = $2
      WHERE email = $3
      RETURNING email, nom;
    `;
    const updateResult = await db.query(updateQuery, [hashedNewPassword, false, email]);

    if (updateResult.rowCount === 0) {
      return res.status(500).json({ error: "Erreur de mise à jour." });
    }

    console.log(`✅ Mot de passe mis à jour pour ${email}`);

    const getUserQuery = `
      SELECT id, email, pseudo, avatar, annee, annee_validated, validation_envoyee
      FROM utilisateurs WHERE email = $1
    `;
    const getUserResult = await db.query(getUserQuery, [email]);
    const utilisateur = getUserResult.rows[0];

    if (!utilisateur) {
      return res.status(500).send("Impossible de charger l'utilisateur.");
    }

    req.session.user = {
      id: utilisateur.id,
      annee_validated: utilisateur.annee_validated,
      validation_envoyee: utilisateur.validation_envoyee,
      email: utilisateur.email,
      pseudo: utilisateur.pseudo,
      avatar: utilisateur.avatar,
      annee: utilisateur.annee
    };

    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;

    return res.status(200).json({
      message: "Mot de passe changé avec succès.",
      user: { email: utilisateur.email, nom: user.nom },
    });

  } catch (err) {
    console.error("❌ Erreur new-password :", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// ─── CHANGEMENT D'EMAIL ───────────────────────────────────────────────────────
// MODIFIÉ : suppression de token + email de confirmation.
//           Le changement d'email est appliqué immédiatement après vérification
//           du mot de passe. La session est mise à jour en conséquence.
app.post('/api/change-mail', async (req, res) => {
  console.log("📩 [API] /api/change-mail appelée");

  try {
    const { newemail, oldemail, password } = req.body;
    const currentemail = req.session?.user?.email;

    if (!currentemail) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const userResult = await db.query(
      "SELECT * FROM utilisateurs WHERE email = $1",
      [currentemail]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    if (oldemail !== user.email) {
      return res.status(401).json({ error: 'Email incorrect.' });
    }

    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    const existingUserResult = await db.query(
      "SELECT * FROM utilisateurs WHERE email = $1",
      [newemail]
    );
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Ce nouvel email est déjà utilisé.' });
    }

    // Changement direct sans confirmation par email
    await db.query(
      "UPDATE utilisateurs SET email = $1, email_pending = NULL WHERE email = $2",
      [newemail, currentemail]
    );

    // Mise à jour de la session
    req.session.user = {
      ...req.session.user,
      email: newemail
    };

    console.log(`✅ Email changé : ${currentemail} → ${newemail}`);
    return res.json({ success: true, message: 'Email mis à jour avec succès.' });

  } catch (err) {
    console.error("🔥 Exception /api/change-mail:", err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});


// ─── PROFIL UTILISATEUR ───────────────────────────────────────────────────────
app.get('/api/utilisateur', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Non authentifié" });
  }
  return res.json({
    success: true, utilisateur: {
      pseudo: req.session.user.pseudo,
      avatar: req.session.user.avatar,
      annee: req.session.user.annee,
      annee_validated: req.session.user.annee_validated,
      validation_envoyee: req.session.user.validation_envoyee
    }
  });
});

app.get('/api/mon-compte', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) {
    return res.status(401).json({ success: false, message: "Utilisateur non authentifié" });
  }

  const query = `SELECT nom, prenom, pseudo, faculte, avatar FROM utilisateurs WHERE email = $1`;

  try {
    const result = await db.query(query, [email]);
    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Utilisateur non trouvé" });
    }
    return res.json({ success: true, utilisateur: result.rows[0] });
  } catch (err) {
    console.error("Erreur récupération utilisateur:", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.post('/api/update', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) {
    return res.status(401).json({ success: false, message: "Utilisateur non authentifié." });
  }

  const { nom, prenom, pseudo, faculte, avatar } = req.body;

  const updateQuery = `
    UPDATE utilisateurs
    SET nom = $1, prenom = $2, pseudo = $3, faculte = $4, avatar = $5
    WHERE email = $6
    RETURNING email;
  `;

  try {
    const result = await db.query(updateQuery, [nom, prenom, pseudo, faculte, avatar, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    req.session.user = { ...req.session.user, pseudo, avatar };

    console.log("Utilisateur mis à jour :", email);
    return res.json({ success: true, message: "Informations mises à jour avec succès !" });

  } catch (err) {
    console.error("Erreur update profil :", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});


// ─── QCM ──────────────────────────────────────────────────────────────────────
app.post("/api/choixmodule", (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.module = req.body.module;
  res.json({ success: true });
});

app.post("/api/choixfaculte", (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.faculte = req.body.faculte;
  res.json({ success: true });
});

app.post("/api/choixcours", (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.cours = req.body.cours;
  res.json({ success: true });
});

app.post("/api/choixcaract", (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.nombre = req.body.nombre;
  req.session.qcm.correction = req.body.correction;
  res.json({ success: true });
});

function melanger(array) {
  return array.sort(() => Math.random() - 0.5);
}

app.get("/api/questions", async (req, res) => {
  try {
    const { faculte, module, cours, nombre, correction } = req.session.qcm || {};

    if (!faculte || !module || !nombre) {
      return res.json({ success: false, error: "Infos QCM manquantes en session" });
    }

    let sql = "SELECT * FROM questions WHERE module = $1";
    const params = [module];
    let paramIndex = 2;

    if (Array.isArray(faculte) && faculte.length > 0) {
      const placeholders = faculte.map((_, i) => `$${paramIndex + i}`).join(", ");
      sql += ` AND faculte IN (${placeholders})`;
      params.push(...faculte);
      paramIndex += faculte.length;
    } else if (typeof faculte === "string") {
      sql += ` AND faculte = $${paramIndex++}`;
      params.push(faculte);
    }

    if (Array.isArray(cours) && cours.length > 0) {
      const placeholders = cours.map((_, i) => `$${paramIndex + i}`).join(", ");
      sql += ` AND cours IN (${placeholders})`;
      params.push(...cours);
      paramIndex += cours.length;
    } else if (typeof cours === "string") {
      sql += ` AND cours = $${paramIndex++}`;
      params.push(cours);
    }

    const { rows } = await db.query(sql, params);

    if (!rows.length) {
      return res.json({ success: false, error: "Aucune question trouvée" });
    }

    let selected;
    if (nombre === "toutes") {
      selected = rows;
    } else {
      const nb = parseInt(nombre, 10);
      if (isNaN(nb) || nb <= 0) {
        return res.json({ success: false, error: "Nombre de questions invalide" });
      }
      selected = melanger(rows).slice(0, nb);
    }

    const payload = selected.map(q => ({
      question: q.question,
      cours: q.cours,
      reponses: JSON.parse(q.options),
      corrects: JSON.parse(q.correct),
      image: q.image ? `/images/${q.image}` : null
    }));

    res.json({ success: true, questions: payload, correction });

  } catch (err) {
    console.error("❌ Erreur SELECT PostgreSQL :", err.message);
    return res.json({ success: false, error: "Erreur BDD" });
  }
});

app.post("/api/submit-qcm", (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.note = req.body.note;
  req.session.results = req.body.questions;
  res.json({ success: true });
});

app.get("/api/get-note", (req, res) => {
  if (req.session.note !== undefined) {
    res.json({
      note: req.session.note,
      correction: req.session.qcm.correction,
      full: req.session.results
    });
  } else {
    res.json({ note: null });
  }
});

app.get("/api/get-results", (req, res) => {
  if (req.session.results !== undefined) {
    res.json({ results: req.session.results, success: true });
  } else {
    res.json({ success: false, results: null });
  }
});

app.get("/api/tentative-faux", (req, res) => {
  if (req.session.results !== undefined) {
    res.json({
      results: req.session.results,
      correction: req.session.qcm.correction,
      success: true
    });
  } else {
    res.json({ success: false, results: null });
  }
});


// ─── SIGNALEMENT ──────────────────────────────────────────────────────────────
app.post("/api/report-error", async (req, res) => {
  try {
    const { question, reponses, reponsesCorrectes, typeErreur, commentaire } = req.body;
    const emailUser = req.session.user.email;

    envoyerEmailMerciUtilisateur(emailUser);
    envoyerEmailsignalemet(emailUser, question, reponses, reponsesCorrectes, typeErreur, commentaire);

    res.json({ success: true, message: "Signalement envoyé !" });

  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'email" });
  }
});


// ─── CONTACT ──────────────────────────────────────────────────────────────────
app.post('/api/contact-mail', async (req, res) => {
  const { nom, email, message } = req.body;

  if (!nom || !email || !message) {
    return res.json({ success: false, error: 'Champs manquants' });
  }

  try {
    await envoyermailcontact(nom, email, message);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: 'Erreur serveur' });
  }
});


// ─── STATS ────────────────────────────────────────────────────────────────────
app.get("/stats/cours-par-module", async (req, res) => {
  try {
    const sql = `
      SELECT LOWER(TRIM(module)) AS module, COUNT(DISTINCT cours) AS nombre_cours
      FROM questions
      WHERE module IS NOT NULL
      GROUP BY LOWER(TRIM(module))
      ORDER BY LOWER(TRIM(module))
    `;
    const result = await db.query(sql);

    if (!result.rows || result.rows.length === 0) {
      return res.json({ ok: true, message: "Aucun module trouvé", rows: [] });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur stats cours par module :", err);
    res.status(500).json({ error: "Erreur serveur", detail: err.message });
  }
});

app.get("/stats/questions-par-cours", async (req, res) => {
  const { module, faculte } = req.query;

  try {
    const query = `
      SELECT LOWER(TRIM(cours)) AS cours, COUNT(*) AS nombre_questions
      FROM questions
      WHERE LOWER(TRIM(module)) = LOWER(TRIM($1))
        AND LOWER(TRIM(faculte)) = LOWER(TRIM($2))
      GROUP BY LOWER(TRIM(cours))
    `;
    const result = await db.query(query, [module, faculte]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur stats questions par cours :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// ─── ADMIN — QUESTIONS ────────────────────────────────────────────────────────
app.get('/api/adminquestions', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: "Utilisateur non connecté" });
    }

    const sql = `
      SELECT id, faculte, module, cours, question, options, correct, image
      FROM questions ORDER BY id ASC
    `;
    const result = await db.query(sql);

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

    const sql = `
      INSERT INTO questions (faculte, module, cours, question, options, correct, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const result = await db.query(sql, [
      faculte, module, cours, question,
      JSON.stringify(options || []),
      JSON.stringify(correct || []),
      image || null
    ]);
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

    const sql = `
      UPDATE questions
      SET faculte=$1, module=$2, cours=$3, question=$4, options=$5, correct=$6, image=$7
      WHERE question=$8 RETURNING *
    `;
    const result = await db.query(sql, [
      faculte || "", module || "", cours || "", question || "",
      JSON.stringify(options || []),
      JSON.stringify(correct || []),
      image || null, oldQuestion
    ]);

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
    if (!question) {
      return res.status(400).json({ success: false, error: "Texte de la question requis" });
    }

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
          `INSERT INTO questions (faculte, module, cours, question, options, correct, image)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [q.faculte || '', q.module || '', q.cours || '', q.question || '',
           JSON.stringify(q.options || []), JSON.stringify(q.correct || []), q.image || null]
        );
      } else if (q.state === 'changed') {
        const oldQ = q.oldQuestion || (q.oldData ? q.oldData.question : null);
        if (!oldQ) throw new Error('❌ Ancienne question manquante pour modification.');

        const result = await client.query(
          `UPDATE questions
           SET faculte=$1, module=$2, cours=$3, question=$4, options=$5, correct=$6, image=$7
           WHERE question=$8`,
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
  const query = `
    SELECT id, nom, prenom, email, annee
    FROM utilisateurs
    WHERE annee NOT LIKE '%7ème Année Médecine%'
  `;
  const { rows } = await db.query(query);
  return rows;
}

function libelleAnnee(n) {
  const suffix = { 1: "1ère", 2: "2ème", 3: "3ème", 4: "4ème", 5: "5ème", 6: "6ème", 7: "7ème" }[n] || `${n}ème`;
  return `${suffix} Année Médecine`;
}

function getAnneeSuivante(anneeStr) {
  const match = (anneeStr || "").match(/\d+/);
  if (!match) return anneeStr;
  let n = parseInt(match[0], 10);
  if (Number.isNaN(n)) return anneeStr;
  n = Math.min(n + 1, 7);
  return libelleAnnee(n);
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
          `UPDATE utilisateurs
           SET token_validation = $1, annee_validated = 0, validation_envoyee = 1
           WHERE id = $2`,
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

  if (!id || !choix || !token) {
    return res.status(400).send("Paramètres manquants");
  }

  try {
    const result = await db.query(
      `SELECT annee, email, id, pseudo, avatar, token_validation, annee_validated, validation_envoyee
       FROM utilisateurs WHERE id = $1`,
      [id]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).send("Utilisateur introuvable");
    if (user.token_validation !== token) return res.status(403).send("Token invalide");

    if (user.annee_validated) {
      return res.json({ success: false, alreadyValidated: true });
    }

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
  if (!req.session.user) {
    return res.json({ session: false });
  }

  const userId = req.session.user.id;

  try {
    const { rows } = await db.query(
      "SELECT annee_validated FROM utilisateurs WHERE id = $1",
      [userId]
    );

    const row = rows[0];
    return res.json({
      session: true,
      annee_validated: row ? row.annee_validated === true : false
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

app.get('*', (req, res) => {
  res.sendFile(path.join(frontend, 'ouverture2.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});