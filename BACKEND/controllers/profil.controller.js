const db     = require('../config/db');
const bcrypt = require('bcrypt');
const { isYearAvailable } = require('../config/academicYears');

// ─── Changement d'email ───────────────────────────────────────────
exports.changeMail = async (req, res) => {
  try {
    const currentEmail = req.session?.user?.email;
    if (!currentEmail) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const { oldemail, newemail, password } = req.body;

    // 1. Récupérer l'utilisateur
    const result = await db.query(
      'SELECT * FROM utilisateurs WHERE email = $1',
      [currentEmail]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // 2. Vérifier que l'ancien email correspond
    if (oldemail !== user.email) {
      return res.status(401).json({ error: 'email incorrect' });
    }

    // 3. Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: 'password incorrect' });
    }

    // 4. Vérifier que le nouvel email n'est pas déjà utilisé
    const existing = await db.query(
      'SELECT id FROM utilisateurs WHERE email = $1',
      [newemail]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ce nouvel email est déjà utilisé.' });
    }

    // 5. Mettre à jour
    await db.query(
      'UPDATE utilisateurs SET email = $1 WHERE email = $2',
      [newemail, currentEmail]
    );

    // 6. Mettre à jour la session
    req.session.user = { ...req.session.user, email: newemail };

    console.log(`✅ Email changé : ${currentEmail} → ${newemail}`);
    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur change-mail :', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ─── Changement de mot de passe ───────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const email = req.session?.user?.email;
    if (!email) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const { currentPassword, newPassword } = req.body;

    // 1. Récupérer l'utilisateur
    const result = await db.query(
      'SELECT mot_de_passe FROM utilisateurs WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    // 2. Vérifier l'ancien mot de passe
    const match = await bcrypt.compare(currentPassword, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    // 3. Hasher et mettre à jour
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE utilisateurs SET mot_de_passe = $1 WHERE email = $2',
      [hashed, email]
    );

    console.log(`✅ Mot de passe changé : ${email}`);
    return res.json({ message: 'Mot de passe changé avec succès.' });

  } catch (err) {
    console.error('❌ Erreur change-password :', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
// ─── Mon compte (lecture) ─────────────────────────────────────────
exports.monCompte = async (req, res) => {
  const email = req.session?.user?.email;
  if (!email) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  try {
    const result = await db.query(
      'SELECT nom, prenom, pseudo, faculte, avatar FROM utilisateurs WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    return res.json({ success: true, utilisateur: result.rows[0] });

  } catch (err) {
    console.error('❌ Erreur mon-compte :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Update profil ────────────────────────────────────────────────
exports.update = async (req, res) => {
  const email = req.session?.user?.email;
  if (!email) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  const { nom, prenom, pseudo, faculte, avatar, annee } = req.body;

  if (annee !== undefined && !isYearAvailable(annee)) {
    return res.status(400).json({ success: false, error: 'Seule la 1ère année est disponible pour le moment.' });
  }

  try {
    const result = await db.query(
      `UPDATE utilisateurs
       SET nom = $1, prenom = $2, pseudo = $3, faculte = $4, avatar = $5
       WHERE email = $6
       RETURNING email`,
      [nom, prenom, pseudo, faculte, avatar, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    // Mettre à jour la session
    req.session.user = { ...req.session.user, pseudo, avatar, nom, prenom, faculte };

    console.log(`✅ Profil mis à jour : ${email}`);
    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur update :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};