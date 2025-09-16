// 1. On importe la bibliothèque sqlite3 avec le mode "verbose" pour avoir plus de détails en cas d’erreur
const sqlite3 = require('sqlite3').verbose();

// 2. On crée (ou ouvre si elle existe déjà) la base de données nommée "qcm.db"
const db = new sqlite3.Database('qcm.db', (err) => {
  if (err) {
    // Si une erreur survient à la connexion, on l'affiche et on arrête le programme
    console.error("❌ Erreur lors de l'ouverture de la base :", err.message);
    return;
  }
  console.log("✅ Base de données ouverte avec succès.");
});

db.serialize(() => {
// 3. On exécute une requête SQL pour créer une table "utilisateurs"
// Cette table aura : un id, un nom, un prénom, un email, un mot de passe
db.run(`
  CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,   -- identifiant unique généré automatiquement
    nom TEXT NOT NULL,                      -- nom de l'utilisateur (obligatoire)
    prenom TEXT NOT NULL,                   -- prenom de l'utilisateur (obligatoire)
    email TEXT UNIQUE NOT NULL,             -- email unique (obligatoire)
    mot_de_passe TEXT NOT NULL ,             -- mot de passe (obligatoire)
    faculte TEXT,
    annee TEXT,
    pseudo TEXT ,                     -- pseudo de l'utilisateur (obligatoire) 
    avatar TEXT  ,                  -- avatar de l'utilisateur (obligatoire) 
    email_active BOOLEAN DEFAULT false ,
    email_disconnect BOOLEAN DEFAULT false ,
    annee_validated  BOOLEAN DEFAULT false ,
    token_validation TEXT ,
    email_pending TEXT ,
    validation_envoyee BOOLEAN DEFAULT false
    
  )
`, (err) => {
  if (err) {
    // Si la création de la table échoue, on affiche l’erreur
    console.error("❌ Erreur lors de la création de la table :", err.message);
  } else {
    // Sinon, tout s’est bien passé
    console.log("✅ Table 'utilisateurs' créée (ou déjà existante).");
  }
});
//table pour verification email
db.run(`
  CREATE TABLE IF NOT EXISTS verifications_email (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expire DATETIME DEFAULT CURRENT_TIMESTAMP ,
    code TEXT,
    codeExpiration TEXT,
    resend_count INTEGER DEFAULT 0,
    last_resend INTEGER
  )
`, (err) => {
  if (err) {
    console.error("❌ Erreur création table tokens :", err.message);
  } else {
    console.log("✅ Table 'verifications_email' créée.");
  }
});
//table pour les questions QCMS
db.run(`
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculte TEXT,
    module TEXT,
    cours TEXT,
    question TEXT,
    options TEXT,
    correct TEXT ,
    image TEXT 
 )
`, (err) => {
  if (err) {
    console.error("❌ Erreur création table questions :", err.message);
  } else {
    console.log("✅ Table 'questions' créée.");
const fs = require('fs');


// 1. Lire le fichier JSON (ici "questions.json")
const questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));


// 3. Préparer la requête d'insertion
const insertQuery = `
  INSERT INTO questions (faculte, module, cours, question, options, correct, image)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;
let remaining = questions.length;
// 4. Insérer chaque question du JSON
questions.forEach(q => {
  db.run(
    insertQuery,
    [
      q.faculte ,
      q.module ,
      q.cours ,
      q.question,
      JSON.stringify(q.options) , // stocké comme texte
      JSON.stringify(q.correct)  ,// même vide, ça donne "[]"
      q.image
     ],
    (err) => {
      if (err) {
        console.error("❌ Erreur insertion :", err.message);
      } else {
        console.log(`✅ Question insérée : "${q.question}"`);
      }
 // On ferme seulement quand toutes les insertions sont finies
          remaining--;
          if (remaining === 0) {
            db.close((err) => {
              if (err) console.error("❌ Erreur fermeture DB :", err.message);
              else console.log("✅ Base de données fermée correctement.");
            });
         }    
       });
     });
   }
  });
});
