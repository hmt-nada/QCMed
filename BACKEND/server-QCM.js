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

  const checkQuery = "SELECT * FROM utilisateurs WHERE email = ?";
  db.get(checkQuery, [email], async (err, row) => {
    if (err) {
      console.error("Erreur vérification email :", err.message);
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
    if (row) {
      return res.json({ success: false, message: "Email déjà utilisé." });
    }
    try{
  const hashedPassword = await bcrypt.hash(password, 10);
   const token = generateToken();
    const insertQuery = `
      INSERT INTO utilisateurs (nom, prenom, faculte, annee, email, mot_de_passe, email_active, email_disconnect, annee_validated, token_validation, validation_envoyee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    db.run(insertQuery, [nom, prenom, faculte, annee, email, hashedPassword, 0, 0, 1, token, 0], function (err) {
      if (err) {
        console.error("Erreur insertion :", err.message);
        return res.status(500).json({ success: false, message: "Erreur lors de l'enregistrement." });
      }
      console.log("Utilisateur ajouté avec ID :", this.lastID);
      return res.json({ success: true, message: `Bienvenue ${nom}, inscription réussie !` });
    });



    
  }catch (hashError) {
      console.error("Erreur de hachage :", hashError.message);
      return res.status(500).json({ success: false, message: "Erreur lors du hachage du mot de passe." });
    }
  });
});





// --- Route pour pseudo et avatar ---
app.post('/api/pseudo', (req, res) => {
  const { pseudo, avatar,email } = req.body;
  console.log("Reçu pour pseudo :", pseudo, avatar, email); 
const updateQuery = `
    UPDATE utilisateurs
    SET pseudo = ?, avatar = ?
    WHERE email = ?
  `;
  

  db.run(updateQuery, [pseudo, avatar, email], function (err) {
    if (err) {
      console.error("Erreur mise à jour :", err.message);
      return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour." });
    }

    if (this.changes === 0) {
      return res.json({ success: false, message: "Utilisateur non trouvé." });
    }

const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 heures
const token = require('crypto').randomBytes(32).toString('hex');
const insertToken = `
  INSERT INTO verifications_email (email, token, expire)
  VALUES (?, ?, ?)
`;
db.run(insertToken, [email, token, expiration], (err) => {
  if (err) {
    console.error("Erreur insertion token :", err.message);
    return res.status(500).json({ success: false, message: "Erreur token." });
  }
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const lien = `${baseUrl}/api/confirmation/${token}`;
  
  envoyerEmailConfirmation(email, lien)
    .then(() => {
      console.log("Utilisateur mis à jour avec pseudo/avat pour email :", email);
     
       return res.json({ success: true, message: "Email envoyé. Veuillez vérifier votre boîte mail." });
       
    })
    .catch((err) => {
      console.error("Erreur envoi email :", err.message);
     return res.status(500).json({ success: false, message: "Erreur envoi email." });
    });
});

 });
});

//renvoyer un email 
app.post("/api/resend-confirmation", (req, res) => {
  const { email } = req.body;

  // On récupère l’entrée du token existant
  const selectQuery = `
    SELECT token, expire, resend_count, last_resend 
    FROM verifications_email 
    WHERE email = ?
  `;

  db.get(selectQuery, [email], (err, row) => {
    if (err) {
      console.error("Erreur récupération token :", err.message);
      return res.status(500).json({ success: false, message: "Erreur serveur." });
    }

    if (!row) {
      return res.json({ success: false, message: "Aucun token trouvé pour cet email." });
    }

    // Vérification du nombre de tentatives
    if (row.resend_count >= 3) {
      return res.json({ success: false, message: "Nombre maximum de renvois atteint." });
    }

    // Vérification du délai (5 minutes = 300000 ms)
    const now = Date.now();
    if (row.last_resend && now - row.last_resend < 5 * 60 * 1000) {
      const restant = Math.ceil((5 * 60 * 1000 - (now - row.last_resend)) / 1000);
      return res.json({ 
        success: false, 
        message: `Veuillez attendre ${restant} secondes avant de renvoyer l'email.` 
      });
    }

    // Générer un nouveau token (optionnel, tu peux réutiliser l'ancien)
    const newToken = require("crypto").randomBytes(32).toString("hex");
    const newExpire = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Mise à jour du token, du compteur et du dernier envoi
    const updateQuery = `
      UPDATE verifications_email
      SET token = ?, expire = ?, resend_count = resend_count + 1, last_resend = ?
      WHERE email = ?
    `;

    db.run(updateQuery, [newToken, newExpire, now, email], function (err) {
      if (err) {
        console.error("Erreur mise à jour resend :", err.message);
        return res.status(500).json({ success: false, message: "Erreur serveur." });
      }
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const lien = `${baseUrl}/api/confirmation/${newToken}`;
    
      envoyerEmailConfirmation(email, lien)
        .then(() => {
          return res.json({ success: true, message: "Email de confirmation renvoyé." });
        })
        .catch((err) => {
          console.error("Erreur envoi email :", err.message);
          return res.status(500).json({ success: false, message: "Erreur lors de l'envoi." });
        });
    });
  });
});

//recuperation du compte avec code

app.post('/api/envoyer-code', (req, res) => {
  
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // génère 6 chiffres
  const expiration = new Date(Date.now() + 90_000).toISOString(); // Format ISO pour SQLite


  db.get("SELECT * FROM utilisateurs WHERE email = ? AND email_active = 1", [email], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Stocker le code et son expiration dans la base de données
    db.run("UPDATE verifications_email SET code = ?, codeExpiration = ? WHERE email = ?",
      [code, expiration, email],
      (err) => {
        if (err) {
          console.error("Erreur lors de la mise à jour du code :", err.message);
          return res.status(500).json({ error: "Erreur serveur" });
        }
    envoyerEmailConfirmationcode(email, code)
    
     .then(() => {
       return res.json({ success: true, message: "Email envoyé" });
       
    })
    .catch((err) => {
      console.error("Erreur envoi email :", err.message);
     return res.status(500).json({ success: false, message: "Erreur envoi email." });
    });
    });
  });
});

//verification du code 

app.post('/api/verifier-code', (req, res) => {
  const { email, code } = req.body;

  // 1. Vérifier si l'utilisateur existe
  db.get("SELECT * FROM verifications_email WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error("Erreur base de données :", err.message);
      return res.status(500).json({ success: false, message: "Erreur serveur." });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }

    // 2. Vérifier si le code est correct
    if (user.code !== code) {
      return res.json({ success: false, message: "Code incorrect." });
    }

    // 3. Vérifier si le code a expiré
    const expirationDate = new Date(user.codeExpiration);
    const maintenant = new Date();

    if (maintenant > expirationDate) {
      // Supprimer les champs `code` et `codeExpiration` de l'utilisateur
  db.run("UPDATE verifications_email SET code = NULL, codeExpiration = NULL WHERE email = ?", [email], (err) => {
    if (err) {
      console.error("Erreur lors de la suppression du code expiré :", err.message);
    }
  });
      return res.json({ success: false, message: "Code expiré." });
    }

    // ✅ 4. Code valide
    return res.json({ success: true, message: "Code valide." });
  });
});



//renvoyer le code 
app.post('/api/renvoyer-code', (req, res) => {
  const { email } = req.body;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiration = new Date(Date.now() + 90_000).toISOString();

  db.run("UPDATE verifications_email SET code = ?, codeExpiration = ? WHERE email = ?",
    [code, expiration, email],
    (err) => {
      if (err) {
        console.error("Erreur mise à jour du code :", err.message);
        return res.status(500).json({ error: "Erreur serveur" });
      }

  envoyerEmailConfirmationcode(email, code)
  .then(() => {
    res.json({ success: true, message: "Code renvoyé avec succès." });
  })
  .catch(() => {
    res.status(500).json({ success: false, message: "Erreur envoi du code." });
});
});
});



//confirmation que l'email est active 

app.get('/api/confirmation/:token', (req, res) => {
  const token = req.params.token;

  const query = `SELECT email FROM verifications_email WHERE token = ?`;
  db.get(query, [token], (err, row) => {
    if (err || !row) {
      return res.status(400).send("Lien invalide ou expiré.");
    }

    // Mise à jour
    const update = `UPDATE utilisateurs SET email_active = 1 WHERE email = ?`;
    db.run(update, [row.email], (err) => {
      if (err) return res.status(500).send("Erreur activation compte.");

      // Supprimer le token
      db.run(`DELETE FROM verifications_email WHERE token = ?`, [token], () => {
         // 🔹 Récupérer les infos de l’utilisateur pour la session
        const getUser = `SELECT id, email, pseudo, avatar, annee, annee_validated, validation_envoyee
                         FROM utilisateurs WHERE email = ?`;
        db.get(getUser, [row.email], (err, user) => {
          if (err || !user) {
            return res.status(500).send("Impossible de charger l'utilisateur.");
          }

          // 🔹 Créer la session utilisateur
          req.session.user = {
            id: user.id,
            annee_validated: user.annee_validated,
            email: user.email,
            pseudo: user.pseudo,
            avatar: user.avatar,
            annee: user.annee
          };
          console.log(req.session.user);
// Donner une durée de vie spéciale (30 jours) à cette session
//autoriser la connexion directe pendant 30 jours
     

      res.redirect(`/emailactive.html?email=${encodeURIComponent(row.email)}`);

      });
    });
     });
  });
});

app.get('/api/confirmationnewmail/:token', (req, res) => {
  const token = req.params.token;

  const query = `SELECT email FROM verifications_email WHERE token = ?`;
  db.get(query, [token], (err, row) => {
    if (err || !row) return res.status(400).send("Lien invalide ou expiré.");

    // 🔹 Récupérer le nouvel email stocké dans email_pending
    const newEmail = row.email;

    const update = `UPDATE utilisateurs 
                    SET email = ?, email_pending = NULL 
                    WHERE email_pending = ?`;
    db.run(update, [newEmail, newEmail], (err) => {
      if (err) return res.status(500).send("Erreur activation compte.");

      // Supprimer le token
      db.run(`DELETE FROM verifications_email WHERE token = ?`, [token], (err) => {
        if (err) console.error("Erreur suppression token :", err);

        // 🔹 Optionnel : récupérer les infos pour la session
        const getUser = `SELECT id, email, pseudo, avatar, annee, annee_validated 
                         FROM utilisateurs WHERE email = ?`;
        db.get(getUser, [newEmail], (err, user) => {
          if (err || !user) return res.status(500).send("Impossible de charger l'utilisateur.");

          req.session.user = {
            id: user.id,
            annee_validated: user.annee_validated,
            email: user.email,
            pseudo: user.pseudo,
            avatar: user.avatar,
            annee: user.annee
          };
// 🔹 Debug session
          console.log("✅ Session utilisateur mise à jour :", req.session.user);
          // 🔹 Rediriger vers page front-end confirmation
          res.redirect('/accueil.html?emailChanged=true');
        });
      });
    });
  });
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
app.get('/api/mon-compte', (req, res) => {
  const email = req.session.user.email;
  const query = "SELECT nom, prenom, pseudo, faculte, avatar FROM utilisateurs WHERE email = ?";

  db.get(query, [email], (err, row) => {
    if (err) {
      console.error("Erreur récupération utilisateur:", err.message);
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }

    if (!row) {
      return res.json({ success: false, message: "Utilisateur non trouvé" });
    }

    return res.json({ success: true, utilisateur: row });
  });
});

// --- Route de la réinitialisation des champs
// --- Route de la réinitialisation des champs
app.post('/api/update', (req, res) => {
  const email = req.session.user.email;
  const { nom, prenom, pseudo, faculte, avatar } = req.body;

  const updateQuery = `
    UPDATE utilisateurs
    SET nom = ?, prenom = ?, pseudo = ?, faculte = ?, avatar = ?
    WHERE email = ?
  `;

  db.run(updateQuery, [nom, prenom, pseudo, faculte, avatar, email], function (err) {
    if (err) {
      console.error("Erreur update profil :", err.message);
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    // 🔑 Mise à jour de la session
    req.session.user = {
      ...req.session.user, // garder les champs existants (id, email, etc.)
      pseudo,
      avatar
    };

    console.log("Utilisateur mis à jour :", email);
    return res.json({ success: true, message: "Informations mises à jour avec succès !" });
  });
});


//changement du password 
app.post("/api/change-password", (req, res) => {
  const { currentPassword, newPassword } = req.body;
const email=req.session.user.email;
  db.get("SELECT * FROM utilisateurs WHERE email = ?", [email], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const match = await bcrypt.compare(currentPassword, user.mot_de_passe);
    if (!match) {

      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.run("UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?", [hashedNewPassword, email], (err) => {
      if (err) {
        return res.status(500).json({ error: "Erreur de mise à jour." });
      }
      return res.status(200).json({ message: "Mot de passe changé avec succès." });
    });
  });
});

//nouveau mot de passe 
app.post("/api/new-password", async (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM utilisateurs WHERE email = ?", [email], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    try {
      const hashedNewPassword = await bcrypt.hash(password, 10);

      db.run(
        "UPDATE utilisateurs SET mot_de_passe = ?, email_disconnect = ? WHERE email = ?",
        [hashedNewPassword, false, email],
        (err) => {
          if (err) {
            console.error("❌ Erreur mise à jour :", err);
            return res.status(500).json({ error: "Erreur de mise à jour." });
          }

          console.log(`✅ Mot de passe mis à jour pour ${email}, utilisateur reconnecté.`);

          return res.status(200).json({
            message: "Mot de passe changé avec succès.",
            user: { email: user.email, nom: user.nom },
          });
        }
      );
      // 🔹 Récupérer les infos de l’utilisateur pour la session
        const getUser = `SELECT id, email, pseudo, avatar, annee, annee_validated 
                         FROM utilisateurs WHERE email = ?`;
        db.get(getUser, [email], (err, user) => {
          if (err || !user) {
            return res.status(500).send("Impossible de charger l'utilisateur.");
          }
       // 🔹 Créer la session utilisateur
          req.session.user = {
            id: user.id,
            annee_validated: user.annee_validated,
            validation_envoyee: user.validation_envoyee,
            email: user.email,
            pseudo: user.pseudo,
            avatar: user.avatar,
            annee: user.annee
          };
// Donner une durée de vie spéciale (30 jours) à cette session
//autoriser la connexion directe pendant 30 jours
     
 });
    } catch (e) {
      console.error("❌ Erreur hash mot de passe :", e);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  });
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

    const user = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM utilisateurs WHERE email = ?", [currentemail], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      console.warn("⚠️ Utilisateur introuvable en base");
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    console.log("✅ Utilisateur trouvé en base:", user.email);

    if (oldemail !== user.email) {
      console.warn("⚠️ Ancien email incorrect:", oldemail, "≠", user.email);
      return res.status(401).json({ error: 'email incorrect' });
    }

    const match = await bcrypt.compare(password, user.mot_de_passe);
    console.log("🔐 Vérif mot de passe:", match);

    if (!match) {
      console.warn("⚠️ Mot de passe incorrect");
      return res.status(401).json({ error: 'password incorrect' });
    }

    const existingUser = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM utilisateurs WHERE email = ?", [newemail], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      console.warn("⚠️ Email déjà utilisé:", newemail);
      return res.status(400).json({ error: 'Ce nouvel email est déjà utilisé.' });
    }

    console.log("📌 Mise à jour email_pending →", newemail);

    db.run("UPDATE utilisateurs SET email_pending = ? WHERE email = ?", [newemail, currentemail], (err) => {
      if (err) {
        console.error("🔥 Erreur update DB:", err);
        return res.status(500).json({ error: 'Erreur serveur.' });
      }

      const expiration = new Date(Date.now() + 24*60*60*1000).toISOString();
      const token = require('crypto').randomBytes(32).toString('hex');
      console.log("🆕 Token généré:", token);

      db.run("INSERT INTO verifications_email (email, token, expire) VALUES (?, ?, ?)", [newemail, token, expiration], async (err2) => {
        if (err2) {
          console.error("🔥 Erreur insert token:", err2);
          return res.status(500).json({ error: 'Erreur serveur.' });
        }
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
      });
    });
  } catch (err) {
    console.error("🔥 Exception /api/change-mail:", err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

   
      

//connexion a un compte

app.post("/api/connexion", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM utilisateurs WHERE email = ? AND email_active = 1" , [email], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

// Définir rôle
    const role = (email === ADMIN_EMAIL) ? "admin" : "user";

    // ✅ Mettre à jour email_disconnect = false
    db.run("UPDATE utilisateurs SET email_disconnect = ? WHERE email = ?", [false, email], (err) => {
  if (err) {
    console.error("❌ Erreur mise à jour connexion :", err);
    return res.status(500).json({ error: "Erreur interne lors de la connexion" });
  }

  // 🔹 Récupérer les infos de l’utilisateur pour la session
  const getUser = `SELECT id, email, pseudo, avatar, annee, annee_validated
                   FROM utilisateurs WHERE email = ?`;

  db.get(getUser, [email], (err, user) => {
    if (err || !user) {
      return res.status(500).send("Impossible de charger l'utilisateur.");
    }

    // 🔹 Créer la session utilisateur
    req.session.user = {
      id: user.id,
      annee_validated: user.annee_validated,
      validation_envoyee: user.validation_envoyee,
      email: user.email,
      pseudo: user.pseudo,
      avatar: user.avatar,
      role:role,
      annee: user.annee
    };

    console.log(`✅ Utilisateur ${email} connecté (email_disconnect = false)`);

    //Répondre uniquement ici, après avoir mis la session
    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      utilisateur: req.session.user   // tu peux renvoyer direct l’utilisateur
    });
  });
});

    });
  });



// Déconnexion d'un compte
// Déconnexion d'un compte
app.post("/api/deconnexion", (req, res) => {
  if (!req.session.user) {
    return res.json({ success: true, message: "Pas de session active." });
  }

  const emailUser = req.session.user.email;

  // Mise à jour de la DB
  db.run("UPDATE utilisateurs SET email_disconnect = ? WHERE email = ?", [true, emailUser], (err) => {
    if (err) {
      console.error("❌ Erreur update email_disconnect :", err);
      return res.status(500).json({ error: "Erreur lors de la mise à jour de la déconnexion." });
    }

    // Suppression session et cookie
    delete req.session.user;
    res.clearCookie("connect.sid");

    console.log(`✅ Utilisateur ${emailUser} déconnecté (email_disconnect = true)`);

    return res.json({ success: true, message: "Déconnexion réussie." });
  });
});


//suppression du compte  
app.delete("/api/suppression", (req, res) => {
  const { password } = req.body;
const email=req.session.user.email;
  db.get("SELECT * FROM utilisateurs WHERE email = ?", [email], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {

      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

   db.run("DELETE FROM utilisateurs WHERE email = ?", [email], function (err) {
      if (err) {
        return res.status(500).json({ error: "Erreur lors de la suppression du compte." });
      }
    // ➤ Supprimer la session serveur
      if (req.session.user) {
        req.session.destroy(err => {
          if (err) {
            return res.status(500).json({ error: "Erreur lors de la suppression de la session." });
          }

          // ➤ Supprimer aussi le cookie côté client
          res.clearCookie("connect.sid");

          return res.json({ message: "Compte supprimé et déconnecté avec succès." });
        });
      } else {
        return res.json({ message: "Compte supprimé avec succès." });
      }
    });
  });
});

//supprimer les comptes inactives 

setInterval(() => {
  const now = new Date().toISOString();
  const deleteQuery = `
    DELETE FROM utilisateurs
    WHERE email IN (
      SELECT email FROM verifications_email WHERE expire < ?
    ) AND email_active = 0
  `;

  db.run(deleteQuery, [now], function (err) {
    if (err) {
      console.error("❌ Erreur suppression comptes inactifs :", err.message);
    } else {
      console.log(`🧹 Comptes supprimés : ${this.changes}`);
    }
  });

  // Supprimer aussi les anciens tokens
  db.run(`DELETE FROM verifications_email WHERE expire < ?`, [now]);
}, 60 * 60 * 1000); // toutes les heures









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

app.get("/api/questions", (req, res) => {
  // Ici tu récupères la session (fac, module, cours, nombre)
  const { faculte, module, cours, nombre, correction } = req.session.qcm || {};

  if (!faculte || !module || !nombre) {
    return res.json({ success: false, error: "Infos QCM manquantes en session" });
  }

  // Construire la requête SQL
  let sql = "SELECT * FROM questions WHERE module = ?";
  let params = [module];

  // Facultés multiples
  if (Array.isArray(faculte) && faculte.length > 0) {
    sql += " AND faculte IN (" + faculte.map(() => "?").join(",") + ")";
    params = params.concat(faculte);
  } else if (typeof faculte === "string") {
    sql += " AND faculte = ?";
    params.push(faculte);
  }

  // Cours multiples
  if (Array.isArray(cours) && cours.length > 0) {
    sql += " AND cours IN (" + cours.map(() => "?").join(",") + ")";
    params = params.concat(cours);
  } else if (typeof cours === "string") {
    sql += " AND cours = ?";
    params.push(cours);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("❌ Erreur SELECT :", err.message);
      return res.json({ success: false, error: "Erreur BDD" });
    }

    if (!rows.length) {
      return res.json({ success: false, error: "Aucune question trouvée" });
    }

    // Mélanger et limiter au nombre demandé
    let selected;
  if (req.session.qcm.nombre === "toutes") {
    selected = rows; // toutes les questions
  } else {
    // convertir en nombre entier au cas où
    const nb = parseInt(req.session.qcm.nombre, 10);
    if (isNaN(nb) || nb <= 0) {
      return res.json({ success: false, error: "Nombre de questions invalide" });
    }
    selected = melanger(rows).slice(0, nb); // mélanger et limiter
  }

    // Transformer pour le frontend
    const payload = selected.map(q => ({
      question: q.question,
      cours: q.cours,
      reponses: JSON.parse(q.options),
      corrects: JSON.parse(q.correct),
      image: q.image ? `/images/${q.image}` : null 
    }));

    res.json({ success: true, questions: payload, correction: correction });
  });
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
function getUtilisateurs() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT id, nom, prenom, email, annee FROM utilisateurs WHERE email_active = 1 AND annee NOT LIKE '%7ème Année Médecine%'",
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
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
  console.log("Début envoi email automatique");

  try {
    const utilisateurs = await getUtilisateurs(); // 👉 utilise ta fonction avec conditions

    for (const u of utilisateurs) {
      const token = generateToken();

      db.run(
        "UPDATE utilisateurs SET token_validation = ?, annee_validated = 0, validation_envoyee = 1 WHERE id = ?",
        [token, u.id],
        (err) => {
          if (err) {
            console.error("Erreur update token pour utilisateur", u.id, err);
          } else {
            envoyerEmailValidation(
              u.email,
              u.id,
              u.annee,
              getAnneeSuivante(u.annee),
              token
              
            );
          }
        }
      );
    }
  } catch (err) {
    console.error("Erreur récupération utilisateurs :", err);
  }
}, { timezone: 'Africa/Algiers' });

//l'envoie de l'email pour la validation de l'annee 

app.post("/api/choix-annee", (req, res) => {
  const { id, choix, token } = req.body;
  if (!id || !choix || !token) return res.status(400).send("Paramètres manquants");

  db.get("SELECT annee, email, id, pseudo, avatar, token_validation, annee_validated FROM utilisateurs WHERE id = ?", [id], (err, user) => {
    if (!user) return res.status(404).send("Utilisateur introuvable");
    if (user.token_validation !== token) return res.status(403).send("Token invalide");

    // 🚨 Vérifier si déjà validé
    if (user.annee_validated) {
      return res.json({ success: false, alreadyValidated: true });
    }

    // Sinon, on valide maintenant
    
    const nouvelleAnnee = (choix === "passe") ? getAnneeSuivante(user.annee) : user.annee;

    db.run(
      "UPDATE utilisateurs SET annee = ?, annee_validated = 1 WHERE id = ?",
      [nouvelleAnnee, id],
      function(err) {
        if (err) return res.status(500).send("Erreur serveur");
         // ⚡ Mettre à jour la session avec la nouvelle année
        req.session.user = {
          email: user.email,
          annee_validated: 1,
          annee: nouvelleAnnee,
          validation_envoyee: user.validation_envoyee,
          id: user.id,          
          pseudo: user.pseudo,
          avatar: user.avatar,
            
        };
        return res.json({ success: true, email: user.email });
      }
    );
  });
});

//verifier si la session existe et l'année est validée (ouverture)
app.get("/api/check-status", (req, res) => {
    if (!req.session.user) {
        return res.json({ session: false });
    }

    const userId = req.session.user.id;
    db.get("SELECT annee_validated FROM utilisateurs WHERE id = ?", [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ session: true, annee_validated: false });
        }
        return res.json({ 
            session: true, 
            annee_validated: row ? row.annee_validated === 1 : false
        });
    });
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
app.get("/stats/cours-par-module", (req, res) => {
  const sql = `
    SELECT module, COUNT(DISTINCT cours) AS nombre_cours
    FROM questions
    GROUP BY module
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      res.json(rows); // [{module:"anatomie", nombre_cours:5}, ...]
    }
  });
});

// Nombre de questions par cours pour  module et  faculté
app.get("/stats/questions-par-cours", (req, res) => {
  const { module, faculte } = req.query; // récupère ?module=...&faculte=...

  const sql = `
    SELECT cours, COUNT(*) AS nombre_questions
    FROM questions
    WHERE module = ? AND faculte = ?
    GROUP BY cours
  `;

  db.all(sql, [module, faculte], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      // Exemple de réponse :
      // [{cours:"structuredesglucides", nombre_questions:2}, {cours:"lipides", nombre_questions:5}]
      res.json(rows);
    }
  });
});

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


//************************************************************************************************* */


//connexion admin 

// Middleware
//const ADMIN_EMAIL = "on_hamitouche@esi.dz";  // email de l’admin





// Route pour récupérer toutes les questions
// 🔹 Route pour renvoyer toutes les questions
app.get('/api/adminquestions', (req, res) => {
  const sql = `SELECT id, faculte, module, cours, question, options, correct, image FROM questions`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Erreur SQL:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }

    // Normaliser les noms et parser options/correct si ce sont des JSON strings
    const questions = rows.map(r => {
      let options = [];
      let correct = [];
      try { options = r.options ? JSON.parse(r.options) : []; } catch (e) { options = (r.options ? [r.options] : []); }
      try { correct = r.correct ? JSON.parse(r.correct) : []; } catch (e) { correct = (r.correct ? [r.correct] : []); }

      return {
        id: r.id,
        faculte: r.faculte,
        module: r.module,
        cours: r.cours,
        question: r.question,
        options: options,    // tableau
        correct: correct,    // tableau
        image: r.image
      };
    });

    res.json({ success: true, questions });
  });
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
