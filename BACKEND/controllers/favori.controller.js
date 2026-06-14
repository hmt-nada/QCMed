const db = require('../config/db');

function normalizeImageUrl(imageUrl) {
  if (!imageUrl || imageUrl === 'null') return null;
  if (/^(https?:|data:)/i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/')) return imageUrl;
  if (imageUrl.startsWith('images/')) return `/${imageUrl}`;
  return `/images/${imageUrl}`;
}

// ─── Ajouter un favori ────────────────────────────────────────────
exports.ajouter = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ success: false });

  const { question_id } = req.body;

  try {
    await db.query(
      `INSERT INTO questions_favoris (user_id, question_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, question_id) DO NOTHING`,
      [userId, question_id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur ajouter favori :', err.message);
    return res.status(500).json({ success: false });
  }
};

// ─── Supprimer un favori ──────────────────────────────────────────
exports.supprimer = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ success: false });

  const { question_id } = req.body;

  try {
    await db.query(
      `DELETE FROM questions_favoris
       WHERE user_id = $1 AND question_id = $2`,
      [userId, question_id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur supprimer favori :', err.message);
    return res.status(500).json({ success: false });
  }
};

// ─── Liste des favoris ────────────────────────────────────────────
exports.getFavoris = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ success: false });

  try {
    const result = await db.query(
      `SELECT q.id, q.enonce, q.choix_a, q.choix_b, q.choix_c,
              q.choix_d, q.choix_e, q.choix_f,
              q.bonne_reponse, q.explication, q.image_url,
              c.titre AS cours_titre, m.nom AS module_nom
       FROM questions_favoris f
       JOIN questions q ON q.id = f.question_id
       JOIN cours c     ON c.id = q.cours_id
       JOIN modules m   ON m.id = c.module_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    // Transformer comme dans getQuestions
    const lettres = ['A','B','C','D','E','F'];
    const favoris = result.rows.map(q => {
      const reponses = [
        q.choix_a, q.choix_b, q.choix_c,
        q.choix_d, q.choix_e, q.choix_f
      ].filter(c => c !== null && c.trim() !== '');

      const bonnesLettres = (q.bonne_reponse || '').split(',').map(l => l.trim().toUpperCase());
const corrects = bonnesLettres.map(l => lettres.indexOf(l)).filter(i => i >= 0);

      return {
        id:          q.id,
        question:    q.enonce,
        reponses:    reponses,
        corrects: corrects,
        explication: q.explication,
        cours:       q.cours_titre,
        module:      q.module_nom,
        image:       normalizeImageUrl(q.image_url)
      };
    });

    return res.json({ success: true, favoris });
  } catch (err) {
    console.error('❌ Erreur get-favoris :', err.message);
    return res.status(500).json({ success: false });
  }
};