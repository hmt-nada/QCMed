const express = require('express');
const router  = express.Router();
const qcm     = require('../controllers/qcm.controller');

router.get ('/modules',      qcm.getModules);
router.post('/choixmodule',  qcm.choixModule);
router.post('/choixfaculte', qcm.choixFaculte);
router.post('/choixcours',   qcm.choixCours);
router.post('/choixcaract',  qcm.choixCaract);
router.get('/cours-par-module', qcm.coursParModule);
router.get('/facultes', qcm.getFacultes);
router.get('/cours',               qcm.getCours);
router.get('/questions-par-cours', qcm.questionsParCours);
router.get('/questions', qcm.getQuestions);
router.post('/submit-qcm',    qcm.submitQcm);
router.get ('/get-note',      qcm.getNote);
router.get ('/get-results',   qcm.getResults);
router.get ('/tentative-faux', qcm.tentativeFaux);
router.post('/report-error', qcm.reportError);

router.get('/historique',              qcm.getHistorique);
router.get('/historique/:session_id',  qcm.getHistoriqueDetail);
router.get('/statistiques',            qcm.getStatistiques);
module.exports = router;