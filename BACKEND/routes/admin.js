const express = require('express');
const router = express.Router();
const db = require('../config/db');
const isAdmin = require('../middleware/isAdmin');
const isAuthenticated = require('../middleware/isAuthenticated');

// Stats
router.get('/stats', isAdmin, async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Facultés
router.get('/facultes', isAuthenticated, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM facultes ORDER BY nom');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modules filtrés par année (plus de lien avec faculte_id)
router.get('/modules', isAuthenticated, async (req, res) => {
  try {
    const { annee } = req.query;
    const r = await db.query(
      `SELECT * FROM modules
       WHERE ($1::int IS NULL OR annee = $1)
       ORDER BY annee, nom`,
      [annee || null]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cours filtrés par module
router.get('/cours', isAuthenticated, async (req, res) => {
  try {
    const { module_id } = req.query;
    if (!module_id) return res.json([]);
    const r = await db.query(
      'SELECT * FROM cours WHERE module_id = $1 ORDER BY titre',
      [module_id]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Ajouter un module
router.post('/modules', isAdmin, async (req, res) => {
  try {
    const { annee, nom, img } = req.body;
    if (!annee || !nom) return res.status(400).json({ success: false, message: 'annee et nom obligatoires' });
    await db.query(
      'INSERT INTO modules (annee, nom, img) VALUES ($1, $2, $3)',
      [annee, nom, img || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Ajouter un cours
router.post('/cours', isAdmin, async (req, res) => {
  try {
    const { module_id, titre } = req.body;
    if (!module_id || !titre) return res.status(400).json({ success: false, message: 'module_id et titre obligatoires' });
    await db.query(
      'INSERT INTO cours (module_id, titre) VALUES ($1, $2)',
      [module_id, titre]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lister questions avec jointures
// Filtres : faculte_id, cours_id, module_id (via join cours→modules)
router.get('/questions', isAdmin, async (req, res) => {
  try {
    const { faculte_id, cours_id, module_id } = req.query;
    const r = await db.query(
      `SELECT q.*, c.titre AS cours_titre, f.nom AS faculte_nom
       FROM questions q
       LEFT JOIN cours    c ON c.id = q.cours_id
       LEFT JOIN modules  m ON m.id = c.module_id
       LEFT JOIN facultes f ON f.id = q.faculte_id
       WHERE ($1::int IS NULL OR q.faculte_id = $1)
         AND ($2::int IS NULL OR q.cours_id   = $2)
         AND ($3::int IS NULL OR c.module_id  = $3)
       ORDER BY q.id DESC`,
      [faculte_id || null, cours_id || null, module_id || null]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer une question
router.delete('/questions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;