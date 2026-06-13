// ─── Contact ──────────────────────────────────────────────────────
exports.contactMail = async (req, res) => {
  const { nom, email, message } = req.body;

  if (!nom || !email || !message) {
    return res.json({ success: false, error: 'Champs manquants.' });
  }

  try {
    // ⏳ Nodemailer pas encore configuré — on log en attendant
    console.log('📩 Message de contact reçu :');
    console.log('   Nom     :', nom);
    console.log('   Email   :', email);
    console.log('   Message :', message);

    // TODO: activer quand Nodemailer est configuré
    // await envoyerMailContact(nom, email, message);

    return res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur contact-mail :', err.message);
    return res.json({ success: false, error: 'Erreur serveur.' });
  }
};