const db = require('../config/db');

function normalizeImageUrl(imageUrl) {
  if (!imageUrl || imageUrl === 'null') return null;
  if (/^(https?:|data:)/i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/')) return imageUrl;
  if (imageUrl.startsWith('images/')) return `/${imageUrl}`;
  return `/images/${imageUrl}`;
}

// ─── Modules selon l'année de l'utilisateur ───────────────────────
exports.getModules = async (req, res) => {
  const annee = req.session?.user?.annee;
  if (!annee) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  try {
    const result = await db.query(
      'SELECT id, nom, img FROM modules WHERE annee = $1 ORDER BY nom',
      [annee]
    );
    return res.json({ success: true, modules: result.rows });

  } catch (err) {
    console.error('❌ Erreur get-modules :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Choix module ─────────────────────────────────────────────────
exports.choixModule = (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.module = req.body.module;
  res.json({ success: true });
};

// ─── Choix faculté ────────────────────────────────────────────────
exports.choixFaculte = (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.faculte = req.body.faculte;
  res.json({ success: true });
};

// ─── Choix cours ──────────────────────────────────────────────────
exports.choixCours = (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.cours = req.body.cours;
  res.json({ success: true });
};

// ─── Choix caractéristiques (nombre + correction) ─────────────────
exports.choixCaract = (req, res) => {
  req.session.qcm = req.session.qcm || {};
  req.session.qcm.nombre     = req.body.nombre;
  req.session.qcm.correction = req.body.correction;
  res.json({ success: true });
};

// ─── Utilitaire mélange ───────────────────────────────────────────
function melanger(array) {
  return array.sort(() => Math.random() - 0.5);
}
// ─── Stats : nombre de cours par module ───────────────────────────
exports.coursParModule = async (req, res) => {
  const annee = req.session?.user?.annee;
  if (!annee) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  try {
    const result = await db.query(
      `SELECT m.id, m.nom, COUNT(c.id) AS nombre_cours
       FROM modules m
       LEFT JOIN cours c ON c.module_id = m.id
       WHERE m.annee = $1
       GROUP BY m.id, m.nom
       ORDER BY m.nom`,
      [annee]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error('❌ Erreur cours-par-module :', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
// ─── Facultés disponibles ─────────────────────────────────────────
exports.getFacultes = async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  try {
    const result = await db.query(
      'SELECT id, nom FROM facultes ORDER BY nom'
    );
    return res.json({ success: true, facultes: result.rows });

  } catch (err) {
    console.error('❌ Erreur get-facultes :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
// ─── Cours selon le module choisi + facultés sélectionnées ────────
exports.getCours = async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  const moduleId  = req.session.qcm?.module;
  const facultes  = req.session.qcm?.faculte; // tableau d'ids

  if (!moduleId) {
    return res.status(400).json({ success: false, message: 'Aucun module sélectionné.' });
  }

  try {
    let result;

    if (facultes && facultes.length > 0) {
      // Cours qui ont au moins une question dans les facultés sélectionnées
      result = await db.query(
        `SELECT DISTINCT c.id, c.titre
         FROM cours c
         JOIN questions q ON q.cours_id = c.id
         WHERE c.module_id = $1
           AND q.faculte_id = ANY($2::int[])
         ORDER BY c.titre`,
        [moduleId, facultes]
      );
    } else {
      // Tous les cours du module sans filtre faculté
      result = await db.query(
        `SELECT id, titre FROM cours
         WHERE module_id = $1
         ORDER BY titre`,
        [moduleId]
      );
    }

    return res.json({ success: true, cours: result.rows });

  } catch (err) {
    console.error('❌ Erreur get-cours :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Stats : nombre de questions par cours ────────────────────────
exports.questionsParCours = async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  const moduleId = req.session.qcm?.module;
  const facultes = req.session.qcm?.faculte;

  if (!moduleId) {
    return res.status(400).json({ success: false, message: 'Aucun module sélectionné.' });
  }

  try {
    const result = await db.query(
      `SELECT c.id, c.titre, COUNT(q.id) AS nombre_questions
       FROM cours c
       LEFT JOIN questions q ON q.cours_id = c.id
         AND ($2::int[] IS NULL OR q.faculte_id = ANY($2::int[]))
       WHERE c.module_id = $1
       GROUP BY c.id, c.titre
       ORDER BY c.titre`,
      [moduleId, facultes && facultes.length > 0 ? facultes : null]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error('❌ Erreur questions-par-cours :', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ─── Questions selon les choix en session ─────────────────────────
exports.getQuestions = async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  const { module, faculte, cours, nombre, correction } = req.session.qcm || {};

  if (!module || !cours || !cours.length) {
    return res.status(400).json({ success: false, message: 'Session QCM incomplète.' });
  }

  try {
    // 1. Récupérer les questions selon cours + facultés
    let query, params;

    if (faculte && faculte.length > 0) {
      query = `
        SELECT q.id, q.enonce, q.choix_a, q.choix_b, q.choix_c,
               q.choix_d, q.choix_e, q.choix_f,
               q.bonne_reponse, q.explication, q.image_url,
               c.titre AS cours_titre
        FROM questions q
        JOIN cours c ON c.id = q.cours_id
        WHERE q.cours_id = ANY($1::int[])
          AND q.faculte_id = ANY($2::int[])
        ORDER BY RANDOM()
      `;
      params = [cours, faculte];
    } else {
      query = `
        SELECT q.id, q.enonce, q.choix_a, q.choix_b, q.choix_c,
               q.choix_d, q.choix_e, q.choix_f,
               q.bonne_reponse, q.explication, q.image_url,
               c.titre AS cours_titre
        FROM questions q
        JOIN cours c ON c.id = q.cours_id
        WHERE q.cours_id = ANY($1::int[])
        ORDER BY RANDOM()
      `;
      params = [cours];
    }

    let result = await db.query(query, params);
    let rows = result.rows;

    // 2. Limiter le nombre si demandé
    if (nombre && nombre !== 'toutes') {
      const n = parseInt(nombre, 10);
      if (!isNaN(n) && n > 0) {
        rows = rows.slice(0, n);
      }
    }

    // 3. Transformer pour le front
    const questions = rows.map(q => {
      // Construire tableau de choix non-null
      const tousLesChoix = [
        q.choix_a, q.choix_b, q.choix_c,
        q.choix_d, q.choix_e, q.choix_f
      ];
      const reponses = tousLesChoix.filter(c => c !== null && c.trim() !== '');

      // Convertir bonne_reponse "A" → indice 0, "B" → 1, etc.
      const lettres = ['A', 'B', 'C', 'D', 'E', 'F'];
      const bonnesLettres = (q.bonne_reponse || '').split(',').map(l => l.trim().toUpperCase());
      const corrects = bonnesLettres.map(l => lettres.indexOf(l)).filter(i => i >= 0);

      return {
        id:          q.id,
        question:    q.enonce,
        reponses:    reponses,
        corrects: corrects,
        explication: q.explication,
        cours:       q.cours_titre,
        image:       normalizeImageUrl(q.image_url)
      };
    });

    return res.json({
      success:    true,
      questions:  questions,
      correction: correction || null
    });

  } catch (err) {
    console.error('❌ Erreur get-questions :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
// ─── Submit QCM + historique ──────────────────────────────────────
exports.submitQcm = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  const { note, questions } = req.body;
  const moduleId   = req.session.qcm?.module     || null;
  const correction = req.session.qcm?.correction || null;

  // 1. Sauvegarder en session
  req.session.note    = note;
  req.session.results = questions;

  try {
    // 2. Créer la session QCM → récupérer son id
    const sessionResult = await db.query(
      `INSERT INTO sessions_qcm (user_id, note, correction, module_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, note, correction, moduleId]
    );
    const sessionId = sessionResult.rows[0].id;

    // 3. Insérer chaque question dans historique_qcm
    const lettres = ['A','B','C','D','E','F'];

    for (const q of questions) {
      const reponseChoisie = (q.userAnswer || [])
        .map(i => lettres[i])
        .join(',') || null;

      await db.query(
        `INSERT INTO historique_qcm
           (user_id, question_id, reponse_choisie, correct, repondu_le, session_id)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [userId, q.id, reponseChoisie, q.isCorrect, sessionId]
      );
    }

    console.log(`✅ Session ${sessionId} enregistrée : ${questions.length} questions, note ${note}`);
    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur submit-qcm :', err.message);
    // Session sauvegardée en mémoire, on ne bloque pas l'utilisateur
    return res.json({ success: true, warning: 'Historique non enregistré.' });
  }
};

// ─── Get note (depuis session) ────────────────────────────────────
exports.getNote = (req, res) => {
  if (req.session.note !== undefined) {
    return res.json({
      note:       req.session.note,
      correction: req.session.qcm?.correction || null,
      full:       req.session.results || []
    });
  }
  return res.json({ note: null });
};

// ─── Get results (depuis session) ────────────────────────────────
exports.getResults = (req, res) => {
  if (req.session.results !== undefined) {
    return res.json({ success: true, results: req.session.results });
  }
  return res.json({ success: false, results: null });
};

// ─── Tentative faux (retry mode) ─────────────────────────────────
exports.tentativeFaux = (req, res) => {
  if (req.session.results !== undefined) {
    return res.json({
      success:    true,
      results:    req.session.results,
      correction: req.session.qcm?.correction || null
    });
  }
  return res.json({ success: false, results: null });
};
// ─── Signalement erreur question ──────────────────────────────────
exports.reportError = async (req, res) => {
  try {
    const { question, reponses, reponsesCorrectes, typeErreur, commentaire } = req.body;
    const emailUser = req.session?.user?.email;

    if (!emailUser) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }

    // ⏳ Email pas encore configuré — on log en attendant
    console.log('📩 Signalement reçu de :', emailUser);
    console.log('   Question    :', question);
    console.log('   Type erreur :', typeErreur);
    console.log('   Commentaire :', commentaire);

    // TODO: activer quand Nodemailer est configuré
    // await envoyerEmailMerciUtilisateur(emailUser);
    // await envoyerEmailSignalement(emailUser, question, reponses, reponsesCorrectes, typeErreur, commentaire);

    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur report-error :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
// ================================================================
// À COLLER à la fin de qcm.controller.js (avant exports.melanger)
// ================================================================

// ─── Historique : liste des sessions ──────────────────────────────
exports.getHistorique = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  try {
    const result = await db.query(
      `SELECT
         s.id,
         s.note,
         s.created_at,
         m.nom AS module_nom,
         COUNT(h.id)::int AS total_questions
       FROM sessions_qcm s
       LEFT JOIN modules m        ON m.id = s.module_id
       LEFT JOIN historique_qcm h ON h.session_id = s.id
       WHERE s.user_id = $1
       GROUP BY s.id, s.note, s.created_at, m.nom
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error('❌ Erreur get-historique :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Historique : détail d'une session (questions + réponses) ─────
exports.getHistoriqueDetail = async (req, res) => {
  const userId    = req.session?.user?.id;
  const sessionId = parseInt(req.params.session_id, 10);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }
  if (isNaN(sessionId)) {
    return res.status(400).json({ success: false, message: 'ID session invalide.' });
  }

  try {
    // Vérifier que la session appartient bien à cet utilisateur
    const check = await db.query(
      'SELECT id FROM sessions_qcm WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (!check.rows.length) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    // Récupérer toutes les questions de la session avec les réponses
    const result = await db.query(
      `SELECT
         q.enonce,
         q.choix_a, q.choix_b, q.choix_c,
         q.choix_d, q.choix_e, q.choix_f,
         q.bonne_reponse,
         q.explication,
         h.reponse_choisie,
         h.correct
       FROM historique_qcm h
       JOIN questions q ON q.id = h.question_id
       WHERE h.session_id = $1 AND h.user_id = $2
       ORDER BY h.id ASC`,
      [sessionId, userId]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error('❌ Erreur get-historique-detail :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ─── Statistiques globales ────────────────────────────────────────
exports.getStatistiques = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  try {
    // 1. Stats globales : total sessions, moyenne, meilleure note, taux réussite
    const globalResult = await db.query(
      `SELECT
         COUNT(s.id)::int                          AS total_sessions,
         ROUND(AVG(s.note)::numeric, 2)            AS moyenne_generale,
         ROUND(MAX(s.note)::numeric, 2)            AS meilleure_note,
         ROUND(
           (
             SELECT COUNT(*)::numeric
             FROM historique_qcm
             WHERE user_id = $1 AND correct = TRUE
           )
           /
           NULLIF(
             (SELECT COUNT(*)::numeric FROM historique_qcm WHERE user_id = $1),
             0
           ) * 100,
           1
         )                                          AS taux_global
       FROM sessions_qcm s
       WHERE s.user_id = $1`,
      [userId]
    );

    const global = globalResult.rows[0];

    // Si aucune session → répondre directement
    if (!global.total_sessions) {
      return res.json({ total_sessions: 0 });
    }

    // 2. Évolution des notes (20 dernières sessions, ordre chronologique)
    const evolutionResult = await db.query(
      `SELECT s.note, s.created_at, m.nom AS module_nom
       FROM sessions_qcm s
       LEFT JOIN modules m ON m.id = s.module_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 20`,
      [userId]
    );
    // On inverse pour avoir l'ordre chronologique (plus ancien → plus récent)
    const evolution = evolutionResult.rows.reverse();

    // 3. Taux de réussite par module
    const modulesResult = await db.query(
      `SELECT
         m.nom                                        AS module_nom,
         COUNT(DISTINCT s.id)::int                    AS total_sessions,
         ROUND(
           SUM(CASE WHEN h.correct THEN 1 ELSE 0 END)::numeric
           / NULLIF(COUNT(h.id), 0) * 100,
           1
         )                                            AS taux_reussite
       FROM sessions_qcm s
       JOIN modules m         ON m.id = s.module_id
       JOIN historique_qcm h  ON h.session_id = s.id
       WHERE s.user_id = $1
       GROUP BY m.id, m.nom
       ORDER BY taux_reussite DESC`,
      [userId]
    );

    return res.json({
      total_sessions:   global.total_sessions,
      moyenne_generale: global.moyenne_generale,
      meilleure_note:   global.meilleure_note,
      taux_global:      parseFloat(global.taux_global) || 0,
      evolution,
      par_module:       modulesResult.rows
    });

  } catch (err) {
    console.error('❌ Erreur get-statistiques :', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
exports.melanger = melanger;