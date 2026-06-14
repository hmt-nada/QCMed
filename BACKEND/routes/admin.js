const express = require('express');
const router = express.Router();
const db = require('../config/db');
const isAdmin = require('../middleware/isAdmin');
const isAuthenticated = require('../middleware/isAuthenticated');

// Stats
router.get('/stats', isAdmin, async (req, res) => {
  const [q, c, m, u] = await Promise.all([
    db.query('SELECT COUNT(*) FROM questions'),
    db.query('SELECT COUNT(*) FROM cours'),
    db.query('SELECT COUNT(*) FROM modules'),
    db.query('SELECT COUNT(*) FROM utilisateurs')
  ]);
  res.json({
    questions: q.rows[0].count,
    cours:     c.rows[0].count,
    modules:   m.rows[0].count,
    users:     u.rows[0].count
  });
});

// Facultés
router.get('/facultes', isAuthenticated, async (req, res) => {
  const r = await db.query('SELECT * FROM facultes ORDER BY nom');
  res.json(r.rows);
});

// Modules filtrés par faculté
router.get('/modules', isAuthenticated, async (req, res) => {
  const { faculte_id } = req.query;
  const r = await db.query(
    `SELECT * FROM modules
     WHERE ($1::int IS NULL OR faculte_id = $1)
     ORDER BY annee, nom`,
    [faculte_id || null]
  );
  res.json(r.rows);
});

// Cours filtrés par module
router.get('/cours', isAuthenticated, async (req, res) => {
  const { module_id } = req.query;
  const r = await db.query(
    'SELECT * FROM cours WHERE module_id = $1 ORDER BY titre',
    [module_id]
  );
  res.json(r.rows);
});

// Ajouter une question
router.post('/questions', isAdmin, async (req, res) => {
  const { cours_id, faculte_id, enonce, choix_a, choix_b, choix_c,
          choix_d, choix_e, choix_f, bonne_reponse, explication, image_url } = req.body;
  await db.query(
    `INSERT INTO questions (cours_id, faculte_id, enonce, choix_a, choix_b, choix_c,
     choix_d, choix_e, choix_f, bonne_reponse, explication, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [cours_id, faculte_id, enonce, choix_a, choix_b, choix_c,
     choix_d, choix_e, choix_f, bonne_reponse, explication, image_url]
  );
  res.json({ success: true });
});

// Lister questions
router.get('/questions', isAdmin, async (req, res) => {
  const { faculte_id, cours_id, module_id } = req.query;
  const r = await db.query(
    `SELECT q.*, c.titre as cours_titre, f.nom as faculte_nom
     FROM questions q
     LEFT JOIN cours c ON c.id = q.cours_id
     LEFT JOIN facultes f ON f.id = q.faculte_id
     WHERE ($1::int IS NULL OR q.faculte_id = $1)
     AND   ($2::int IS NULL OR q.cours_id   = $2)
     AND   ($3::int IS NULL OR c.module_id  = $3)
     ORDER BY q.id DESC`,
    [faculte_id || null, cours_id || null, module_id || null]
  );
  res.json(r.rows);
});

// Supprimer
router.delete('/questions/:id', isAdmin, async (req, res) => {
  await db.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;