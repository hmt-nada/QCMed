const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const { createClient } = require("redis");
const db = require("./db");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const crypto = require("crypto");
const bodyParser = require('body-parser');
require('dotenv').config();


const {
  envoyerEmailConfirmation,
  envoyerEmailConfirmationcode,
  envoyerEmailsignalemet,
  envoyerEmailMerciUtilisateur,
  envoyerEmailValidation,
  envoyerEmailConfirmationNouvelle,
  envoyermailcontact
} = require("./email");

const app = express();
app.set("trust proxy", 1);


  const redisClient = createClient({
    url:
      process.env.REDIS_URL ||
      "rediss://default:ASxkAAIncDJkOGVmZTI4YzE4MDE0MGNkYTdkN2U1ZWNhNWQzZTNiMHAyMTEzNjQ@trusty-koala-11364.upstash.io:6379",
    socket: { tls: true, rejectUnauthorized: false },
  });

  redisClient.on("error", (err) => console.error("❌ Redis error:", err));

  redisClient.connect()
  .then(() => console.log("✅ Connecté à Redis !"))
  .catch((err) => console.error("❌ Erreur Redis :", err));

  app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "hamitouchenada",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS seulement
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24h
    },
  })
);

app.use(cors({
  origin: "https://qcmed-1x7m.onrender.com", 
  credentials: true
}));

app.use(express.json());


const codesTemp = {}; // Stock temporaire en mémoire

const path = require('path');
// Servir les fichiers frontend
app.use(express.static(path.join(__dirname, "../frontend")));
//autoriser l'accès aux images 
app.use("/images", express.static(path.join(__dirname, "../frontend/images")));


// --- Route d'inscription principale ---
app.post('/api/inscription', async (req, res) => {
  const { nom, prenom, faculte, annee, email, password } = req.body;

  try {
    // Vérifier si l'email existe déjà
    const checkQuery = "SELECT * FROM utilisateurs WHERE email = $1";
    const checkResult = await db.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      return res.json({ success: false, message: "Email déjà utilisé." });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = generateToken();

    // Insertion du nouvel utilisateur
    const insertQuery = `
      INSERT INTO utilisateurs 
      (nom, prenom, faculte, annee, email, mot_de_passe, email_active, email_disconnect, annee_validated, token_validation, validation_envoyee)
      VALUES ($1, $2, $3, $4, $5, $6, false, false, true, $7, false)
      RETURNING id;
    `;

    const insertResult = await db.query(insertQuery, [
      nom,
      prenom,
      faculte,
      annee,
      email,
      hashedPassword,
      token
    ]);

    console.log("✅ Utilisateur ajouté avec ID :", insertResult.rows[0].id);
    return res.json({ success: true, message: `Bienvenue ${nom}, inscription réussie !` });

  } catch (error) {
    console.error("❌ Erreur durant l'inscription :", error.message);
    return res.status(500).json({ success: false, message: "Erreur lors de l'inscription." });
  }
});





app.post('/api/pseudo', async (req, res) => {
  const { pseudo, avatar, email } = req.body;
  console.log("Reçu pour pseudo :", pseudo, avatar, email);

  try {
    // 🔹 1. Mettre à jour pseudo et avatar
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

    // 🔹 2. Créer le token de vérification email
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const token = require('crypto').randomBytes(32).toString('hex');
    const insertToken = `
      INSERT INTO verifications_email (email, token, expire)
      VALUES ($1, $2, $3)
    `;
    await db.query(insertToken, [email, token, expiration]);

    // 🔹 3. Générer le lien
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const lien = `${baseUrl}/api/confirmation/${token}`;

    // 🔹 4. Envoyer l'email en arrière-plan (non bloquant)
    envoyerEmailConfirmation(email, lien)
      .then(() => console.log("✅ Email envoyé :", email))
      .catch(err => console.error("❌ Erreur en envoyant l'email :", err.message));

    // 🔹 5. Répondre immédiatement au frontend
    return res.json({
      success: true,
      message: "Pseudo/avatar mis à jour. Vérifiez votre boîte mail."
    });

  } catch (err) {
    console.error("❌ Erreur dans /api/pseudo :", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});



// --- Renvoyer un email de confirmation (version PostgreSQL / Neon) ---
app.post("/api/resend-confirmation", async (req, res) => {
  const { email } = req.body;

  try {
    // 1️⃣ Vérifier si l'email existe dans la table verifications_email
    const selectQuery = `
      SELECT token, expire, resend_count, last_resend 
      FROM verifications_email 
      WHERE email = $1
    `;
    const result = await db.query(selectQuery, [email]);

    if (result.rowCount === 0) {
      return res.json({ success: false, message: "Aucun token trouvé pour cet email." });
    }

    const row = result.rows[0];

    // 2️⃣ Vérifier le nombre de renvois (max 3)
    if (Number(row.resend_count) >= 3) {
      return res.json({ success: false, message: "Nombre maximum de renvois atteint." });
    }

    // 3️⃣ Vérifier le délai minimum (5 min)
    const now = Date.now();
    const lastResend = row.last_resend ? new Date(row.last_resend).getTime() : 0;

    if (lastResend && now - lastResend < 5 * 60 * 1000) {
      const restant = Math.ceil((5 * 60 * 1000 - (now - lastResend)) / 1000);
      return res.json({
        success: false,
        message: `Veuillez attendre ${restant} secondes avant de renvoyer l'email.`,
      });
    }

    // 4️⃣ Générer un nouveau token (sécurisé)
    const newToken = require("crypto").randomBytes(32).toString("hex");
    const newExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 5️⃣ Mettre à jour le token + compteur + date
    const updateQuery = `
      UPDATE verifications_email
      SET token = $1,
          expire = $2,
          resend_count = resend_count + 1,
          last_resend = to_timestamp($3 / 1000.0)
      WHERE email = $4
    `;
    await db.query(updateQuery, [newToken, newExpire, now, email]);

    // 6️⃣ Envoyer le mail
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const lien = `${baseUrl}/api/confirmation/${newToken}`;

    await envoyerEmailConfirmation(email, lien);

    return res.json({ success: true, message: "Email de confirmation renvoyé." });

  } catch (err) {
    console.error("❌ Erreur dans /api/resend-confirmation :", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

//recuperation du compte avec code

app.post('/api/envoyer-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 90_000); // 90 secondes

  try {
    // 1️⃣ Vérifier si l'utilisateur existe et que son email est actif
    const userQuery = `
      SELECT * FROM utilisateurs 
      WHERE email = $1 AND email_active = TRUE
    `;
    const userResult = await db.query(userQuery, [email]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // 2️⃣ Vérifier si une entrée existe déjà dans verifications_email
    const checkQuery = `
      SELECT * FROM verifications_email WHERE email = $1
    `;
    const checkResult = await db.query(checkQuery, [email]);

    if (checkResult.rowCount > 0) {
      // 🔹 Mise à jour du code et de l’expiration
      const updateQuery = `
        UPDATE verifications_email
        SET code = $1, codeexpiration = $2
        WHERE email = $3
      `;
      await db.query(updateQuery, [code, expiration, email]);
    } else {
      // 🔹 Création d'une nouvelle entrée
      const insertQuery = `
        INSERT INTO verifications_email (email, code, codeexpiration)
        VALUES ($1, $2, $3)
      `;
      await db.query(insertQuery, [email, code, expiration]);
    }

    // 3️⃣ Envoi de l'email avec le code
    await envoyerEmailConfirmationcode(email, code);

    res.json({ success: true, message: "Email envoyé avec succès." });

  } catch (err) {
    console.error("❌ Erreur dans /api/envoyer-code :", err.message);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'envoi du code." });
  }
});


//verification du code 

app.post('/api/verifier-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    // 1️⃣ Récupérer la ligne correspondante
    const query = `SELECT * FROM verifications_email WHERE email = $1`;
    const result = await db.query(query, [email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }

    const user = result.rows[0];

    // 2️⃣ Vérifier le code
    if (user.code !== code) {
      return res.json({ success: false, message: "Code incorrect." });
    }

    // 3️⃣ Vérifier l’expiration
    const expirationDate = new Date(user.codeexpiration);
    const maintenant = new Date();

    if (maintenant > expirationDate) {
      await db.query(
        `UPDATE verifications_email 
         SET code = NULL, codeexpiration = NULL 
         WHERE email = $1`,
        [email]
      );
      return res.json({ success: false, message: "Code expiré." });
    }

    // 4️⃣ Supprimer le code après succès
    await db.query(
      `UPDATE verifications_email 
       SET code = NULL, codeexpiration = NULL 
       WHERE email = $1`,
      [email]
    );

    return res.json({ success: true, message: "Code valide." });

  } catch (err) {
    console.error("❌ Erreur dans /api/verifier-code :", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});




//renvoyer le code 
// --- Route : renvoyer le code (adaptée à PostgreSQL / Neon) ---
app.post('/api/renvoyer-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email requis." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 90_000).toISOString();

  try {
    const updateQuery = `
      UPDATE verifications_email
      SET code = $1, "codeExpiration" = $2
      WHERE email = $3
      RETURNING email;
    `;

    const result = await db.query(updateQuery, [code, expiration, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Aucun utilisateur trouvé avec cet email." });
    }

    await envoyerEmailConfirmationcode(email, code);
    res.json({ success: true, message: "Code renvoyé avec succès." });

  } catch (err) {
    console.error("Erreur renvoi du code :", err.message);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});




//confirmation que l'email est active 

// --- Route : confirmation que l'email est active (version PostgreSQL / Neon) ---
app.get('/api/confirmation/:token', async (req, res) => {
  const token = req.params.token;

  try {
    // 1️⃣ Vérifier le token dans la table verifications_email
    const query = `SELECT email FROM verifications_email WHERE token = $1`;
    const { rows } = await db.query(query, [token]);

    if (rows.length === 0) {
      return res.status(400).send("Lien invalide ou expiré.");
    }

    const email = rows[0].email;

    // 2️⃣ Activer l'email dans la table utilisateurs ✅ (booléen, pas entier)
    const update = `UPDATE utilisateurs SET email_active = true WHERE email = $1`;
    await db.query(update, [email]);

    // 3️⃣ Supprimer le token
    await db.query(`DELETE FROM verifications_email WHERE token = $1`, [token]);

    // 4️⃣ Récupérer les infos utilisateur
    const getUser = `
      SELECT id, email, pseudo, avatar, annee, annee_validated, validation_envoyee
      FROM utilisateurs
      WHERE email = $1
    `;
    const userResult = await db.query(getUser, [email]);

    if (userResult.rows.length === 0) {
      return res.status(500).send("Impossible de charger l'utilisateur.");
    }

    const user = userResult.rows[0];

    // 5️⃣ Créer la session utilisateur
    req.session.user = {
      id: user.id,
      annee_validated: user.annee_validated,
      email: user.email,
      pseudo: user.pseudo,
      avatar: user.avatar,
      annee: user.annee,
    };

    console.log("✅ Session créée :", req.session.user);

    // 6️⃣ Rediriger vers ta page frontend
    res.redirect(`/emailactive.html?email=${encodeURIComponent(email)}`);

  } catch (err) {
    console.error("❌ Erreur confirmation :", err.message);
    res.status(500).send("Erreur serveur lors de l'activation du compte.");
  }
});


// --- Route : confirmation du nouvel email (version PostgreSQL / Neon) ---
app.get('/api/confirmationnewmail/:token', async (req, res) => {
  const token = req.params.token;

  try {
    // 1️⃣ Vérifier le token
    const query = `SELECT email FROM verifications_email WHERE token = $1`;
    const { rows } = await db.query(query, [token]);

    if (rows.length === 0) {
      return res.status(400).send("Lien invalide ou expiré.");
    }

    const newEmail = rows[0].email;

    // 2️⃣ Mettre à jour l'adresse email définitive
    const update = `
      UPDATE utilisateurs
      SET email = $1, email_pending = NULL
      WHERE email_pending = $2
    `;
    await db.query(update, [newEmail, newEmail]);

    // 3️⃣ Supprimer le token
    await db.query(`DELETE FROM verifications_email WHERE token = $1`, [token]);

    // 4️⃣ Récupérer les infos utilisateur
    const getUser = `
      SELECT id, email, pseudo, avatar, annee, annee_validated
      FROM utilisateurs
      WHERE email = $1
    `;
    const userResult = await db.query(getUser, [newEmail]);

    if (userResult.rows.length === 0) {
      return res.status(500).send("Impossible de charger l'utilisateur.");
    }

    const user = userResult.rows[0];

    // 5️⃣ Mettre à jour la session
    req.session.user = {
      id: user.id,
      annee_validated: user.annee_validated,
      email: user.email,
      pseudo: user.pseudo,
      avatar: user.avatar,
      annee: user.annee,
    };

    console.log("✅ Session utilisateur mise à jour :", req.session.user);

    // 6️⃣ Rediriger vers ta page de confirmation
    res.redirect('/accueil.html?emailChanged=true');

  } catch (err) {
    console.error("❌ Erreur confirmation nouvel email :", err.message);
    res.status(500).send("Erreur serveur lors de la confirmation du nouvel email.");
  }
});


//recuperation du photo et avatar t année 
app.get('/api/utilisateur', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Non authentifié" });
  }
  
  // Répond directement avec les infos stockées en session
  return res.json({ success: true, utilisateur: {
    pseudo: req.session.user.pseudo,
    avatar: req.session.user.avatar,
    annee: req.session.user.annee,
    annee_validated: req.session.user.annee_validated,
    validation_envoyee: req.session.user.validation_envoyee
  }});
});


//initialisation des champs des infos du compte 
app.get('/api/mon-compte', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) {
    return res.status(401).json({ success: false, message: "Utilisateur non authentifié" });
  }

  const query = `
    SELECT nom, prenom, pseudo, faculte, avatar
    FROM utilisateurs
    WHERE email = $1
  `;

  try {
    const result = await db.query(query, [email]); // ⚠️ db.query au lieu de db.get
    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Utilisateur non trouvé" });
    }

    return res.json({ success: true, utilisateur: result.rows[0] });
  } catch (err) {
    console.error("Erreur récupération utilisateur:", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// --- Route de la réinitialisation des champs
// --- Route de la réinitialisation des champs
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

    // 🔑 Mise à jour de la session
    req.session.user = {
      ...req.session.user,
      pseudo,
      avatar
    };

    console.log("Utilisateur mis à jour :", email);
    return res.json({ success: true, message: "Informations mises à jour avec succès !" });

  } catch (err) {
    console.error("Erreur update profil :", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
app.post("/api/change-password", async (req, res) => {
  const email = req.session.user?.email;
  if (!email) {
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // 🔍 Vérifie si l'utilisateur existe
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


//nouveau mot de passe 
app.post("/api/new-password", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔍 Vérifier que l'utilisateur existe
    const userResult = await db.query("SELECT * FROM utilisateurs WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const user = userResult.rows[0];

    // 🔐 Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(password, 10);

    // 🔄 Mettre à jour le mot de passe et reconnecter
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

    console.log(`✅ Mot de passe mis à jour pour ${email}, utilisateur reconnecté.`);

    // 🧠 Récupérer à nouveau les infos utilisateur pour la session
    const getUserQuery = `
      SELECT id, email, pseudo, avatar, annee, annee_validated, validation_envoyee
      FROM utilisateurs
      WHERE email = $1
    `;
    const getUserResult = await db.query(getUserQuery, [email]);
    const utilisateur = getUserResult.rows[0];

    if (!utilisateur) {
      return res.status(500).send("Impossible de charger l'utilisateur.");
    }

    // 🔑 Créer la session utilisateur
    req.session.user = {
      id: utilisateur.id,
      annee_validated: utilisateur.annee_validated,
      validation_envoyee: utilisateur.validation_envoyee,
      email: utilisateur.email,
      pseudo: utilisateur.pseudo,
      avatar: utilisateur.avatar,
      annee: utilisateur.annee
    };

    // ⏰ (Optionnel) durée de session 30 jours
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours

    return res.status(200).json({
      message: "Mot de passe changé avec succès.",
      user: { email: utilisateur.email, nom: user.nom },
    });

  } catch (err) {
    console.error("❌ Erreur new-password :", err.message);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});


// 🔹 Route : changement d'email
app.post('/api/change-mail', async (req, res) => {
  console.log("📩 [API] /api/change-mail appelée");

  try {
    const { newemail, oldemail, password } = req.body;
    console.log("👉 Données reçues:", { newemail, oldemail, password });

    const currentemail = req.session?.user?.email;
    console.log("🔑 Email session utilisateur:", currentemail);

    if (!currentemail) {
      console.warn("⚠️ Aucun utilisateur en session");
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // 🔹 1️⃣ Récupérer l'utilisateur actuel
    const userResult = await db.query(
      "SELECT * FROM utilisateurs WHERE email = $1",
      [currentemail]
    );
    const user = userResult.rows[0];

    if (!user) {
      console.warn("⚠️ Utilisateur introuvable en base");
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    console.log("✅ Utilisateur trouvé en base:", user.email);

    // 🔹 2️⃣ Vérifier l'ancien email
    if (oldemail !== user.email) {
      console.warn("⚠️ Ancien email incorrect:", oldemail, "≠", user.email);
      return res.status(401).json({ error: 'email incorrect' });
    }

    // 🔹 3️⃣ Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.mot_de_passe);
    console.log("🔐 Vérif mot de passe:", match);

    if (!match) {
      console.warn("⚠️ Mot de passe incorrect");
      return res.status(401).json({ error: 'password incorrect' });
    }

    // 🔹 4️⃣ Vérifier que le nouvel email n’existe pas déjà
    const existingUserResult = await db.query(
      "SELECT * FROM utilisateurs WHERE email = $1",
      [newemail]
    );
    if (existingUserResult.rows.length > 0) {
      console.warn("⚠️ Email déjà utilisé:", newemail);
      return res.status(400).json({ error: 'Ce nouvel email est déjà utilisé.' });
    }

    console.log("📌 Mise à jour email_pending →", newemail);

    // 🔹 5️⃣ Mettre à jour le champ email_pending
    await db.query(
      "UPDATE utilisateurs SET email_pending = $1 WHERE email = $2",
      [newemail, currentemail]
    );

    // 🔹 6️⃣ Créer un token de confirmation
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const token = require('crypto').randomBytes(32).toString('hex');
    console.log("🆕 Token généré:", token);

    // 🔹 7️⃣ Insérer la vérification dans la table verifications_email
    await db.query(
      `INSERT INTO verifications_email (email, token, expire)
       VALUES ($1, $2, $3)`,
      [newemail, token, expiration]
    );

    // 🔹 8️⃣ Envoi du mail de confirmation
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const lien = `${baseUrl}/api/confirmationnewmail/${token}`;

    console.log("📧 Envoi email de confirmation à", newemail, "→ lien:", lien);

    try {
      await envoyerEmailConfirmationNouvelle(newemail, lien);
      console.log("✅ Email de confirmation envoyé");
      return res.json({ success: true, message: 'Un email de confirmation a été envoyé.' });
    } catch (errMail) {
      console.error("🔥 Erreur envoi email:", errMail);
      return res.status(500).json({ error: 'Erreur envoi email.' });
    }

  } catch (err) {
    console.error("🔥 Exception /api/change-mail:", err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

   
      

//connexion a un compte
const ADMIN_EMAIL = "on_hamitouche@esi.dz";  // email de l’admin

/*const ADMIN_EMAILS = ["on_hamitouche@esi.dz", "autre@exemple.com"];
const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";*/

app.post("/api/connexion", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔹 Requête PostgreSQL (note : pas de `?`, mais `$1`, `$2`, etc.)
    const result = await db.query(
      "SELECT * FROM utilisateurs WHERE email = $1 AND email_active = TRUE",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // 🔐 Vérification du mot de passe
    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // 🧩 Déterminer le rôle
    const role = (email === ADMIN_EMAIL) ? "admin" : "user";

    // 🔹 Mise à jour du champ email_disconnect
    await db.query(
      "UPDATE utilisateurs SET email_disconnect = FALSE WHERE email = $1",
      [email]
    );

    // 🔹 Récupérer les infos de l’utilisateur pour la session
    const userData = await db.query(
      `SELECT id, email, pseudo, avatar, annee, annee_validated
       FROM utilisateurs WHERE email = $1`,
      [email]
    );

    const utilisateur = userData.rows[0];
    if (!utilisateur) {
      return res.status(500).send("Impossible de charger l'utilisateur.");
    }

    // 🔹 Créer la session utilisateur
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

    console.log(`✅ Utilisateur ${email} connecté (email_disconnect = false)`);

    // ✅ Réponse finale
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



// Déconnexion d'un compte
// Déconnexion d'un compte
app.post("/api/deconnexion", async (req, res) => {
  try {
    // 🔹 Vérifier s'il existe une session active
    if (!req.session.user) {
      return res.json({ success: true, message: "Pas de session active." });
    }

    const emailUser = req.session.user.email;

    // 🔹 Mise à jour du champ email_disconnect dans la base
    await db.query(
      "UPDATE utilisateurs SET email_disconnect = TRUE WHERE email = $1",
      [emailUser]
    );

    // 🔹 Suppression de la session et du cookie
    delete req.session.user;
    res.clearCookie("connect.sid");

    console.log(`✅ Utilisateur ${emailUser} déconnecté (email_disconnect = true)`);

    // 🔹 Réponse finale
    return res.json({ success: true, message: "Déconnexion réussie." });

  } catch (err) {
    console.error("❌ Erreur update email_disconnect :", err);
    return res.status(500).json({
      error: "Erreur lors de la mise à jour de la déconnexion."
    });
  }
});



//suppression du compte  
app.delete("/api/suppression", async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.session.user?.email;

    if (!email) {
      return res.status(401).json({ error: "Aucune session active." });
    }

    // 🔹 Vérifier que l'utilisateur existe
    const result = await db.query("SELECT * FROM utilisateurs WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    // 🔹 Vérification du mot de passe
    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    // 🔹 Suppression du compte utilisateur
    await db.query("DELETE FROM utilisateurs WHERE email = $1", [email]);

    // 🔹 Suppression de la session côté serveur
    if (req.session.user) {
      req.session.destroy(err => {
        if (err) {
          console.error("Erreur suppression session :", err);
          return res.status(500).json({ error: "Erreur lors de la suppression de la session." });
        }

        // 🔹 Suppression du cookie côté client
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

//supprimer les comptes inactives 

setInterval(async () => {
  const now = new Date().toISOString();

  try {
    // 🔹 Suppression des comptes inactifs dont le token a expiré
    const deleteUsersQuery = `
      DELETE FROM utilisateurs
      WHERE email IN (
        SELECT email FROM verifications_email WHERE expire < $1
      )
      AND email_active = FALSE
    `;
    const resultUsers = await db.query(deleteUsersQuery, [now]);
    console.log(`🧹 Comptes supprimés : ${resultUsers.rowCount}`);

    // 🔹 Suppression des anciens tokens expirés
    const deleteTokensQuery = `DELETE FROM verifications_email WHERE expire < $1`;
    const resultTokens = await db.query(deleteTokensQuery, [now]);
    console.log(`🧾 Tokens supprimés : ${resultTokens.rowCount}`);

  } catch (err) {
    console.error("❌ Erreur suppression comptes/tokens inactifs :", err.message);
  }
}, 60 * 60 * 1000); // ⏰ exécution toutes les heures


//stocker le module choisis dans la session 
// Page 1 : choix du module
app.post("/api/choixmodule", (req, res) => {
  req.session.qcm = req.session.qcm || {};  // si casier vide, on le crée
  req.session.qcm.module = req.body.module;
  console.log(req.session);
  res.json({
    success: true
  });
});

// Page 2 : choix du faculté
app.post("/api/choixfaculte", (req, res) => {
  req.session.qcm = req.session.qcm || {};  // si casier vide, on le crée
  req.session.qcm.faculte = req.body.faculte;
  console.log(req.session);
  res.json({
    success: true
  });
});
// Page 3 : choix des cours
app.post("/api/choixcours", (req, res) => {
  req.session.qcm = req.session.qcm || {};  // si casier vide, on le crée
  req.session.qcm.cours = req.body.cours;
  console.log(req.session);
  res.json({
    success: true
  });
});
// Page 4 : choix des caracteristiques
app.post("/api/choixcaract", (req, res) => {
  req.session.qcm = req.session.qcm || {};  // si casier vide, on le crée
  req.session.qcm.nombre = req.body.nombre;
  req.session.qcm.correction = req.body.correction;
  console.log(req.session);
  res.json({
    success: true
  });
});

//récupération des questions a partir de la base 

//fonction pour un ordre random des questions 
function melanger(array) {
  return array.sort(() => Math.random() - 0.5);
}
//récuperation ds questions 

app.get("/api/questions", async (req, res) => {
  try {
    // 🔹 Récupération des infos QCM stockées dans la session
    const { faculte, module, cours, nombre, correction } = req.session.qcm || {};

    if (!faculte || !module || !nombre) {
      return res.json({ success: false, error: "Infos QCM manquantes en session" });
    }

    // 🔹 Construction dynamique de la requête
    let sql = "SELECT * FROM questions WHERE module = $1";
    const params = [module];
    let paramIndex = 2; // car $1 déjà utilisé

    // Facultés multiples
    if (Array.isArray(faculte) && faculte.length > 0) {
      const placeholders = faculte.map((_, i) => `$${paramIndex + i}`).join(", ");
      sql += ` AND faculte IN (${placeholders})`;
      params.push(...faculte);
      paramIndex += faculte.length;
    } else if (typeof faculte === "string") {
      sql += ` AND faculte = $${paramIndex++}`;
      params.push(faculte);
    }

    // Cours multiples
    if (Array.isArray(cours) && cours.length > 0) {
      const placeholders = cours.map((_, i) => `$${paramIndex + i}`).join(", ");
      sql += ` AND cours IN (${placeholders})`;
      params.push(...cours);
      paramIndex += cours.length;
    } else if (typeof cours === "string") {
      sql += ` AND cours = $${paramIndex++}`;
      params.push(cours);
    }

    // 🔹 Exécution de la requête
    const { rows } = await db.query(sql, params);

    if (!rows.length) {
      return res.json({ success: false, error: "Aucune question trouvée" });
    }

    // 🔹 Sélectionner les questions selon le nombre demandé
    let selected;
    if (nombre === "toutes") {
      selected = rows;
    } else {
      const nb = parseInt(nombre, 10);
      if (isNaN(nb) || nb <= 0) {
        return res.json({ success: false, error: "Nombre de questions invalide" });
      }

      // Fonction de mélange locale
      const melanger = (arr) => arr.sort(() => Math.random() - 0.5);
      selected = melanger(rows).slice(0, nb);
    }

    // 🔹 Formatage pour le frontend
    const payload = selected.map(q => ({
      question: q.question,
      cours: q.cours,
      reponses: JSON.parse(q.options),
      corrects: JSON.parse(q.correct),
      image: q.image ? `/images/${q.image}` : null
    }));

    // 🔹 Réponse finale
    res.json({ success: true, questions: payload, correction });

  } catch (err) {
    console.error("❌ Erreur SELECT PostgreSQL :", err.message);
    return res.json({ success: false, error: "Erreur BDD" });
  }
});

//stocker la note de utilisateur 
app.post("/api/submit-qcm", (req, res) => {
    req.session.qcm = req.session.qcm || {};  // si casier vide, on le crée
    // Stocker dans la session
    req.session.note = req.body.note;
    req.session.results = req.body.questions;
       console.log(req.session);
    res.json({ success: true });
});
//envoyer la note a la page de note 
app.get("/api/get-note", (req, res) => {
    if (req.session.note !== undefined) {
        res.json({ 
          note: req.session.note ,
          correction: req.session.qcm.correction,
          full:req.session.results        
        });
    } else {
        res.json({ note: null });
    }
});
//envoyer a la page de afficher la correction 
app.get("/api/get-results", (req, res) => {
    if (req.session.results !== undefined) {
        res.json({ 
          results: req.session.results,
          success: true           
        });
    } else {
        res.json({ success:false, results: null });
    }
});

//envoyer a la page de qcm de fausses questions 
app.get("/api/tentative-faux", (req, res) => {
    if (req.session.results !== undefined) {
        res.json({ 
          results: req.session.results,
          correction:req.session.qcm.correction ,
          success: true           
        });
    } else {
        res.json({ success:false, results: null });
    }
});

// === ROUTE SIGNALER FAUTE dans la question===
app.post("/api/report-error", async (req, res) => {
  try {
    const { question, reponses, reponsesCorrectes, typeErreur, commentaire } = req.body;
    const emailUser = req.session.user.email;

    // Envoyer mail à l’utilisateur
     envoyerEmailMerciUtilisateur(emailUser);

    // Envoyer mail à l’associé
     envoyerEmailsignalemet(emailUser, question, reponses, reponsesCorrectes, typeErreur, commentaire);

    res.json({ success: true, message: "Signalement envoyé !" });

  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi de l'email" });
  }
});




// 🔹 Fonction pour récupérer tous les utilisateurs
async function getUtilisateurs() {
  try {
    const query = `
      SELECT id, nom, prenom, email, annee
      FROM utilisateurs
      WHERE email_active = TRUE
        AND annee NOT LIKE '%7ème Année Médecine%'
    `;
    const { rows } = await db.query(query);
    return rows;
  } catch (err) {
    throw err;
  }
}

// Construit un libellé propre et cohérent
function libelleAnnee(n) {
  const suffix = {1:"1ère",2:"2ème",3:"3ème",4:"4ème",5:"5ème",6:"6ème",7:"7ème"}[n] || `${n}ème`;
  return `${suffix} Année Médecine`; // toujours orthographié correctement
}

function getAnneeSuivante(anneeStr) {
  // extrait le numéro (tolère 1ére/1ère/1eme etc.)
  const match = (anneeStr || "").match(/\d+/);
  if (!match) return anneeStr;              // rien trouvé → on ne touche pas
  let n = parseInt(match[0], 10);
  if (Number.isNaN(n)) return anneeStr;     // sécurité
  n = Math.min(n + 1, 7);                   // borne à 7
  return libelleAnnee(n);
}

function generateToken() {
  return crypto.randomBytes(16).toString("hex"); // 32 caractères hexadécimaux
}





//validation de l'anneé chaque rentrée (le 20 septemre de chaque année)
//min heure jour mois 
cron.schedule('5 20 6 9 *', async () => {
  console.log("📧 Début envoi email automatique");

  try {
    const utilisateurs = await getUtilisateurs(); // ta fonction déjà adaptée pour PostgreSQL

    for (const u of utilisateurs) {
      const token = generateToken();

      try {
        // 🔹 Mise à jour PostgreSQL
        await db.query(
          `UPDATE utilisateurs
           SET token_validation = $1,
               annee_validated = 0,
               validation_envoyee = 1
           WHERE id = $2`,
          [token, u.id]
        );

        // 🔹 Envoi email
        await envoyerEmailValidation(
          u.email,
          u.id,
          u.annee,
          getAnneeSuivante(u.annee),
          token
        );

        console.log(`✅ Email envoyé à ${u.email} avec token ${token}`);

      } catch (errUpdate) {
        console.error(`❌ Erreur update token pour utilisateur ${u.id}:`, errUpdate);
      }
    }

  } catch (err) {
    console.error("❌ Erreur récupération utilisateurs :", err);
  }
}, { timezone: 'Africa/Algiers' });
//l'envoie de l'email pour la validation de l'annee 

app.post("/api/choix-annee", async (req, res) => {
  const { id, choix, token } = req.body;

  if (!id || !choix || !token) {
    return res.status(400).send("Paramètres manquants");
  }

  try {
    // 🔹 Récupérer l'utilisateur
    const result = await db.query(
      `SELECT annee, email, id, pseudo, avatar, token_validation, annee_validated, validation_envoyee
       FROM utilisateurs
       WHERE id = $1`,
      [id]
    );

    const user = result.rows[0];

    if (!user) return res.status(404).send("Utilisateur introuvable");
    if (user.token_validation !== token) return res.status(403).send("Token invalide");

    // 🚨 Vérifier si déjà validé
    if (user.annee_validated) {
      return res.json({ success: false, alreadyValidated: true });
    }

    // 🔹 Calcul de la nouvelle année
    const nouvelleAnnee = (choix === "passe") ? getAnneeSuivante(user.annee) : user.annee;

    // 🔹 Mise à jour PostgreSQL
    await db.query(
      `UPDATE utilisateurs
       SET annee = $1, annee_validated = TRUE
       WHERE id = $2`,
      [nouvelleAnnee, id]
    );

    // 🔹 Mise à jour de la session
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

//verifier si la session existe et l'année est validée (ouverture)
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



app.post('/api/contact-mail', async (req, res) => {
    const { nom, email, message } = req.body;

    if (!nom || !email || !message) {
        return res.json({ success: false, error: 'Champs manquants' });
    }

    // Exemple : envoyer un email
   
        try {
    await envoyermailcontact(nom, email, message);
    res.json({ success: true });
} catch (err) {
    console.error(err);
    res.json({ success: false, error: 'Erreur serveur' });
}
});
//nombre de cours par module 
// --- Route : nombre de cours par module (PostgreSQL / Neon) ---
app.get("/stats/cours-par-module", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT LOWER(TRIM(module)) AS module, COUNT(DISTINCT cours) AS nombre_cours
      FROM questions
      GROUP BY LOWER(TRIM(module))
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur stats cours par module :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Nombre de questions par cours pour  module et  faculté
// --- Route : nombre de questions par cours (PostgreSQL / Neon) ---
app.get("/stats/questions-par-cours", async (req, res) => {
  const { module, faculte } = req.query; // récupère ?module=...&faculte=...

  try {
    const query = `
      SELECT LOWER(TRIM(cours)) AS cours, COUNT(*) AS nombre_questions
      FROM questions
      WHERE LOWER(TRIM(module)) = LOWER(TRIM($1))
        AND LOWER(TRIM(faculte)) = LOWER(TRIM($2))
      GROUP BY LOWER(TRIM(cours))
    `;

    const result = await db.query(query, [module, faculte]);

    // Exemple de réponse :
    // [{ cours: "structuredesglucides", nombre_questions: 2 }, { cours: "lipides", nombre_questions: 5 }]
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur stats questions par cours :", err.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
//************************************************************************************************* */
//connexion admin 

// Middleware
// Route pour récupérer toutes les questions
// 🔹 Route pour renvoyer toutes les questions
// 🔹 Route pour renvoyer toutes les questions (Neon PostgreSQL)
app.get('/api/adminquestions', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: "Utilisateur non connecté" });
    }

    console.log("✅ Route /api/adminquestions appelée par :", req.session.user.email);

    // ⚡ Requête PostgreSQL
    const sql = `
      SELECT id, faculte, module, cours, question, options, correct, image
      FROM questions
      ORDER BY id ASC
    `;

    const result = await db.query(sql); // db = pool Neon / pg.Pool

    // ⚙️ Normalisation options / correct
    const questions = result.rows.map(r => {
      let options = [];
      let correct = [];
      try { options = r.options ? JSON.parse(r.options) : []; } catch(e){ options = r.options ? [r.options] : [] }
      try { correct = r.correct ? JSON.parse(r.correct) : []; } catch(e){ correct = r.correct ? [r.correct] : [] }

      return {
        id: r.id,
        faculte: r.faculte || "",
        module: r.module || "",
        cours: r.cours || "",
        question: r.question || "",
        options,
        correct,
        image: r.image || ""
      };
    });

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
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      faculte,
      module,
      cours,
      question,
      JSON.stringify(options || []),
      JSON.stringify(correct || []),
      image || null
    ];

    const result = await db.query(sql, params);
    res.json({ success: true, question: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.put('/api/adminquestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { faculte, module, cours, question, options, correct, image } = req.body;

    const sql = `
      UPDATE questions
      SET faculte=$1, module=$2, cours=$3, question=$4, options=$5, correct=$6, image=$7
      WHERE id=$8
      RETURNING *
    `;
    const params = [
      faculte,
      module,
      cours,
      question,
      JSON.stringify(options || []),
      JSON.stringify(correct || []),
      image || null,
      id
    ];

    const result = await db.query(sql, params);
    res.json({ success: true, question: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete('/api/adminquestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM questions WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post('/api/save-questions', (req, res) => {
  const questions = req.body.questions; // tableau envoyé par le frontend
  if (!Array.isArray(questions)) {
    return res.status(400).json({ success: false, message: "Format invalide" });
  }

  // Exemple avec SQLite
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO questions (id, faculte, module, cours, question, options, correct, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    db.serialize(() => {
      questions.forEach(q => {
        stmt.run(
          q.id,
          q.faculte || '',
          q.module || '',
          q.cours || '',
          q.question || '',
          JSON.stringify(q.options || []),
          JSON.stringify(q.correct || []),
          q.image || ''
        );
      });
    });
    stmt.finalize();
    res.json({ success: true, message: "Questions sauvegardées" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});
//************************************************************************************************* */






const frontend = path.join(__dirname, '../FRONTEND');

// Servir les fichiers statiques
app.use(express.static(frontend));

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(frontend, 'ouverture2.html'));
});

// Fallback SPA (pour toutes les autres routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontend, 'ouverture2.html'));
});





const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
