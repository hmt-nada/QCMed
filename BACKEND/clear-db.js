const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('qcm.db');

// Supprime tous les utilisateurs
db.run("DELETE FROM utilisateurs", (err) => {
  if (err) {
    return console.error("❌ Erreur suppression utilisateurs :", err.message);
  }
  console.log("✅ Tous les utilisateurs ont été supprimés.");

  // Réinitialise l'auto-incrémentation de l'id
  db.run("DELETE FROM sqlite_sequence WHERE name = 'utilisateurs'", (err) => {
    if (err) {
      return console.error("❌ Erreur réinitialisation ID :", err.message);
    }
    console.log("✅ Compteur ID réinitialisé à 1.");
  });
});

db.run("DELETE FROM questions", (err) => {
  if (err) {
    return console.error("❌ Erreur suppression utilisateurs :", err.message);
  }
  console.log("✅ Tous les utilisateurs ont été supprimés.");

  // Réinitialise l'auto-incrémentation de l'id
  db.run("DELETE FROM sqlite_sequence WHERE name = 'questions'", (err) => {
    if (err) {
      return console.error("❌ Erreur réinitialisation ID :", err.message);
    }
    console.log("✅ Compteur ID réinitialisé à 1.");
  });
});

// Ferme la base après un court délai (pour laisser les requêtes finir)
setTimeout(() => {
  db.close((err) => {
    if (err) {
      return console.error("❌ Erreur fermeture DB :", err.message);
    }
    console.log("✅ Base fermée.");
  });
}, 200);
