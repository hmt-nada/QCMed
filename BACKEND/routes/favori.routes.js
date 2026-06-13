const express = require('express');
const router  = express.Router();
const favori  = require('../controllers/favori.controller');

router.post  ('/favoris/ajouter',   favori.ajouter);
router.delete('/favoris/supprimer', favori.supprimer);
router.get   ('/favoris',           favori.getFavoris);

module.exports = router;