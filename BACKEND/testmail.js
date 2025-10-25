const { envoyerEmailConfirmation } = require("./email");

envoyerEmailConfirmation("hamitouchenada799@gmail.com", "http://localhost:3000/test")
  .then(() => console.log("Email envoyé !"))
  .catch(err => console.error("Erreur Nodemailer :", err.message));
