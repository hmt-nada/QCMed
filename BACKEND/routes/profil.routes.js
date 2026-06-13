const express = require('express');
const router  = express.Router();
const profil  = require('../controllers/profil.controller');

router.post('/change-mail',     profil.changeMail);
router.post('/change-password', profil.changePassword);
router.get ('/mon-compte', profil.monCompte);
router.post('/update',     profil.update);

module.exports = router;