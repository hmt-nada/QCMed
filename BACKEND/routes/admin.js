const express = require('express');
const router = express.Router();
const db = require('../config/db');
const isAdmin = require('../middleware/isAdmin');
const isAuthenticated = require('../middleware/isAuthenticated');

const logAdminError = (context, err, req) => {
  console.error(`[admin][${context}]`, {
    message: err.message,
    code: err.code,
    detail: err.detail,
    hint: err.hint,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl || req.path,
    body: req.body,
    sessionUser: req.session?.user || null,
  });
};

const sendAdminError = (res, err, context, req) => {
  logAdminError(context, err, req);
  return res.status(500).json({
    success: false,
    message: 'Erreur serveur lors de la modification des données.',
    details: err.message,
    code: err.code || null,
  });
};

// Debug endpoint for diagnosing session/body/database issues.
router.get('/debug-session', isAdmin, (req, res) => {
  console.log('[admin][debug-session] session=', req.session);
  console.log('[admin][debug-session] body=', req.body);
  console.log('[admin][debug-session] headers=', req.headers);

  return res.json({
    success: true,
    session: req.session || null,
    body: req.body || null,
    headers: req.headers || null,
  });
});

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
      users:     u.rows[0].count,
    });
  } catch (err) {
    sendAdminError(res, err, 'GET /stats', req);
  }
});

// Facultés
router.get('/facultes', isAuthenticated, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM facultes ORDER BY nom');
    res.json(r.rows);
  } catch (err) {
    sendAdminError(res, err, 'GET /facultes', req);
  }
});

// Modules filtrés par année
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
    sendAdminError(res, err, 'GET /modules', req);
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
    sendAdminError(res, err, 'GET /cours', req);
  }
});

// Ajouter un module
router.post('/modules', isAdmin, async (req, res) => {
  try {
    const rawAnnee = req.body?.annee;
    const rawNom = req.body?.nom;
    const rawImg = req.body?.img;

    const annee = Number(rawAnnee);
    const nom = typeof rawNom === 'string' ? rawNom.trim() : '';
    const img = typeof rawImg === 'string' && rawImg.trim() ? rawImg.trim() : null;

    if (!Number.isInteger(annee) || annee < 1 || annee > 7) {
      return res.status(400).json({
        success: false,
        message: 'Année invalide. Veuillez choisir une année entre 1 et 7.',
      });
    }

    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du module est obligatoire.',
      });
    }

    await db.query(
  'INSERT INTO modules (annee, nom, img) VALUES ($1, $2, $3)',
  [annee, nom, img]
);

    return res.json({ success: true });
  } catch (err) {
    return sendAdminError(res, err, 'POST /modules', req);
  }
});

// Ajouter un cours
router.post('/cours', isAdmin, async (req, res) => {
  try {
    const rawModuleId = req.body?.module_id;
    const rawTitre = req.body?.titre;

    const moduleId = Number(rawModuleId);
    const titre = typeof rawTitre === 'string' ? rawTitre.trim() : '';

    if (!Number.isInteger(moduleId) || moduleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'module_id invalide.',
      });
    }

    if (!titre) {
      return res.status(400).json({
        success: false,
        message: 'Le titre du cours est obligatoire.',
      });
    }

    await db.query(
  'INSERT INTO cours (module_id, titre) VALUES ($1, $2)',
  [moduleId, titre]
);

    return res.json({ success: true });
  } catch (err) {
    return sendAdminError(res, err, 'POST /cours', req);
  }
});

// Supprimer un cours (et toutes ses questions)
router.delete('/cours/:id', isAdmin, async (req, res) => {
  const courseId = Number(req.params.id);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de cours invalide.'
    });
  }

  try {
    await db.query('BEGIN');

    const deleteQuestions = await db.query(
      'DELETE FROM questions WHERE cours_id = $1',
      [courseId]
    );

    const deleteCourse = await db.query(
      'DELETE FROM cours WHERE id = $1',
      [courseId]
    );

    await db.query('COMMIT');

    return res.json({
      success: true,
      deletedQuestions: deleteQuestions.rowCount || 0,
      deletedCourse: deleteCourse.rowCount || 0,
    });
  } catch (err) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    return sendAdminError(res, err, `DELETE /cours/${req.params.id}`, req);
  }
});

// Supprimer un module (avec ses cours et questions)
router.delete('/modules/:id', isAdmin, async (req, res) => {
  const moduleId = Number(req.params.id);

  if (!Number.isInteger(moduleId) || moduleId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de module invalide.'
    });
  }

  try {
    await db.query('BEGIN');

    const courseRows = await db.query(
      'SELECT id FROM cours WHERE module_id = $1',
      [moduleId]
    );

    const courseIds = courseRows.rows.map(row => row.id);

    let deletedQuestions = 0;
    if (courseIds.length > 0) {
      const deleteQuestions = await db.query(
        'DELETE FROM questions WHERE cours_id = ANY($1)',
        [courseIds]
      );
      deletedQuestions = deleteQuestions.rowCount || 0;
    }

    const deleteCourses = await db.query(
      'DELETE FROM cours WHERE module_id = $1',
      [moduleId]
    );

    const deleteModule = await db.query(
      'DELETE FROM modules WHERE id = $1',
      [moduleId]
    );

    await db.query('COMMIT');

    return res.json({
      success: true,
      deletedCours: deleteCourses.rowCount || 0,
      deletedQuestions,
      deletedModule: deleteModule.rowCount || 0,
    });
  } catch (err) {
    try { await db.query('ROLLBACK'); } catch (_) {}
    return sendAdminError(res, err, `DELETE /modules/${req.params.id}`, req);
  }
});

// Lister questions avec jointures
router.get('/questions', isAdmin, async (req, res) => {
  try {
    const { faculte_id, cours_id, module_id, annee } = req.query;
    const r = await db.query(
      `SELECT q.*, c.titre AS cours_titre, f.nom AS faculte_nom
       FROM questions q
       LEFT JOIN cours    c ON c.id = q.cours_id
       LEFT JOIN modules  m ON m.id = c.module_id
       LEFT JOIN facultes f ON f.id = q.faculte_id
       WHERE ($1::int IS NULL OR q.faculte_id = $1)
         AND ($2::int IS NULL OR q.cours_id   = $2)
         AND ($3::int IS NULL OR c.module_id  = $3)
         AND ($4::int IS NULL OR m.annee      = $4)
       ORDER BY q.id DESC`,
      [faculte_id || null, cours_id || null, module_id || null, annee || null]
    );
    res.json(r.rows);
  } catch (err) {
    sendAdminError(res, err, 'GET /questions', req);
  }
});

// Supprimer une question
router.delete('/questions/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    sendAdminError(res, err, `DELETE /questions/${req.params.id}`, req);
  }
});

module.exports = router;