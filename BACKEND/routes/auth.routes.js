const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/auth.controller');

router.post('/inscription', auth.inscription);
router.post('/pseudo',      auth.pseudo);
router.post('/connexion', auth.connexion);
router.post('/recover-email', auth.recoverEmail);
router.post('/recover-identity', auth.recoverIdentity);
router.post('/recover-password', auth.recoverPassword);
router.post  ('/deconnexion', auth.deconnexion);
router.delete('/suppression', auth.suppression);
router.get('/utilisateur', auth.utilisateur);

module.exports = router;