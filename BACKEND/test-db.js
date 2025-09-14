const sqlite3 = require('sqlite3').verbose();

// Ouvre la base de données
let db = new sqlite3.Database('./qcm.db', (err) => {
  if (err) {
    return console.error('Erreur lors de l\'ouverture de la base:', err.message);
  }
  console.log(' Connexion réussie à la base de données qcm.db');
});

// Exemple : lister les tables existantes
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  if (err) {
    throw err;
  }
  console.log(' Tables dans la base :');
  rows.forEach((row) => {
    console.log(`- ${row.name}`);
  });
});


module.exports = db;