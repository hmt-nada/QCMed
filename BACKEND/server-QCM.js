const express = require("express");
const cors = require("cors");
const session = require("express-session");
const db = require("./config/db");
const bcrypt = require("bcrypt");
const cron = require("node-cron");
const crypto = require("crypto");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

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

// Serve images from a dedicated route (kept before general static for clarity)
app.use("/images", express.static(path.join(__dirname, "../FRONTEND/images")));

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

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// ─── EMAIL ────────────────────────────────────────────────────────────────────
const {
  envoyerEmailsignalemet,
  envoyerEmailMerciUtilisateur,
  envoyerEmailValidation,
  envoyermailcontact
} = require("./email");

// Dans app.js — version améliorée (optionnel)
const isAuthenticated = require('./middleware/isAuthenticated');

app.get('/api/session', isAuthenticated, (req, res) => {
  res.json({ success: true, utilisateur: req.session.user });
});



// ─── FRONTEND ─────────────────────────────────────────────────────────────────
const frontend = path.join(__dirname, '../FRONTEND');

const isAdmin = require('./middleware/isAdmin');

// Protéger panel.html: définir la route AVANT le middleware static.
app.get('/panel.html', isAdmin, (req, res) => {
  return res.sendFile(path.join(frontend, 'panel.html'));
});

// Servir le reste du frontend en statique
app.use(express.static(frontend));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontend, 'ouverture2.html'));
});

// Route catch-all pour les pages HTML uniquement (pas les fichiers statiques)
app.get('*', (req, res) => {
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