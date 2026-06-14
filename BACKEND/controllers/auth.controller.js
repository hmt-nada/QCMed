const db = require('../config/db');
const bcrypt = require('bcrypt');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

function parseAnnee(annee) {
  if (typeof annee === 'number' && Number.isFinite(annee)) return annee;
  if (typeof annee !== 'string') return null;
  const parsed = parseInt(annee, 10);
  if (!Number.isNaN(parsed)) return parsed;
  const match = annee.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// ─── Phase 1 : Inscription (infos de base) ────────────────────────
exports.inscription = async (req, res) => {
  const { nom, prenom, faculte, annee, email, password } = req.body; // ✅ faculte revient
  const anneeValue = parseAnnee(annee);

  if (!nom || !prenom || !faculte || !email || !password || !anneeValue) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
  }

  try {
    const check = await db.query(
      'SELECT id FROM utilisateurs WHERE email = $1',
      [email]
    );
    if (check.rows.length > 0) {
      return res.json({ success: false, message: 'Email déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO utilisateurs (nom, prenom, faculte, annee, email, mot_de_passe, pseudo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [nom, prenom, faculte, anneeValue, email, hashedPassword, '']
    );

    console.log('✅ Utilisateur inscrit, ID :', result.rows[0].id);
    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur inscription :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Phase 2 : Pseudo + Avatar ────────────────────────────────────
exports.pseudo = async (req, res) => {
  const { pseudo, avatar, email } = req.body;

  try {
    const update = await db.query(
      `UPDATE utilisateurs
       SET pseudo = $1, avatar = $2
       WHERE email = $3
       RETURNING id, email, pseudo, avatar, annee`,
      [pseudo, avatar, email]
    );

    if (update.rowCount === 0) {
      return res.json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    const u = update.rows[0];
    // ⚠️ session simplifiée — plus de annee_validated ni validation_envoyee
    const role = ADMIN_EMAILS.includes(u.email.toLowerCase()) ? 'admin' : 'user';

    req.session.user = {
      id:     u.id,
      email:  u.email,
      pseudo: u.pseudo,
      avatar: u.avatar,
      annee:  u.annee,
      role:   role
    };

    console.log('✅ Session créée pour :', u.email);
    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur pseudo :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Connexion ────────────────────────────────────────────────────
exports.connexion = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Vérifier si l'utilisateur existe
    const result = await db.query(
      'SELECT * FROM utilisateurs WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // 2. Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // 3. Créer la session (champs existants uniquement)
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';

    req.session.user = {
      id:     user.id,
      email:  user.email,
      pseudo: user.pseudo,
      avatar: user.avatar,
      annee:  user.annee,
      faculte: user.faculte,
      role:   role
    };

    console.log(`✅ Connexion : ${email}`);

    return res.status(200).json({
      success: true,
      utilisateur: req.session.user
    });

  } catch (err) {
    console.error('❌ Erreur connexion :', err.message);
    return res.status(500).json({ error: 'Erreur interne.' });
  }
};

// ─── Récupération de mot de passe ─────────────────────────────────
exports.recoverEmail = async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Adresse e-mail requise.' });
  }

  try {
    const result = await db.query(
      'SELECT id FROM utilisateurs WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucun compte trouvé avec cet e-mail.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur recoverEmail :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.recoverIdentity = async (req, res) => {
  const { email, nom, prenom } = req.body;
  if (!email || !nom || !prenom) {
    return res.status(400).json({ success: false, message: 'Email, nom et prénom sont requis.' });
  }

  try {
    const result = await db.query(
      'SELECT nom, prenom FROM utilisateurs WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Aucun compte trouvé avec cet e-mail.' });
    }

    const nomOK = (user.nom || '').trim().toLowerCase() === nom.trim().toLowerCase();
    const prenomOK = (user.prenom || '').trim().toLowerCase() === prenom.trim().toLowerCase();

    if (!nomOK || !prenomOK) {
      return res.status(401).json({ success: false, message: 'Nom ou prénom incorrect.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur recoverIdentity :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.recoverPassword = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe valide sont requis.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'UPDATE utilisateurs SET mot_de_passe = $1 WHERE email = $2 RETURNING id',
      [hashedPassword, email.trim().toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur recoverPassword :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Déconnexion ──────────────────────────────────────────────────
exports.deconnexion = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({ success: true, message: 'Pas de session active.' });
    }

    const email = req.session.user.email;
    delete req.session.user;
    res.clearCookie('connect.sid');

    console.log(`✅ Déconnexion : ${email}`);
    return res.json({ success: true, message: 'Déconnexion réussie.' });

  } catch (err) {
    console.error('❌ Erreur déconnexion :', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ─── Suppression du compte ────────────────────────────────────────
exports.suppression = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.session.user?.email;

    if (!email) {
      return res.status(401).json({ error: 'Aucune session active.' });
    }

    const result = await db.query(
      'SELECT * FROM utilisateurs WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Supprimer le compte
    await db.query('DELETE FROM utilisateurs WHERE email = $1', [email]);

    // Détruire la session proprement
    req.session.destroy(err => {
      if (err) {
        console.error('Erreur destruction session :', err);
        return res.status(500).json({ error: 'Erreur session.' });
      }
      res.clearCookie('connect.sid');
      console.log(`🗑️ Compte supprimé : ${email}`);
      return res.json({ message: 'Compte supprimé avec succès.' });
    });

  } catch (err) {
    console.error('❌ Erreur suppression :', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ─── Profil utilisateur (depuis session) ─────────────────────────
exports.utilisateur = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  const u = req.session.user;
  return res.json({
    success: true,
    utilisateur: {
      pseudo:  u.pseudo,
      avatar:  u.avatar,
      annee:   u.annee,
      faculte: u.faculte
    }
  });
};