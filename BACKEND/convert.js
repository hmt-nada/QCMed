const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

// Charger ton fichier Excel
const workbook = xlsx.readFile("QCM-med.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convertir la feuille en tableau d'objets
const rows = xlsx.utils.sheet_to_json(sheet);

// Transformer chaque ligne en format JSON voulu
const questions = rows
  .map((row) => {
    if (!row.question || row.question.trim() === "") return null; // ignorer les questions vides

    // options -> tableau séparé par ;
    const options = row.options
      ? row.options.split(";").map((opt) => opt.trim())
      : [];

    // correct -> tableau de nombres séparés par ,
    const correct = row.correct
      ? row.correct
          .toString()
          .split(",")
          .map((idx) => parseInt(idx.trim(), 10))
          .filter((num) => !isNaN(num))
      : [];

    // image -> valeur exacte de la cellule ou null si vide
    const image = row.image && String(row.image).trim() !== "" ? String(row.image).trim() : null;

    return {
      faculte: row.faculte ? row.faculte.trim() : "",
      module: row.module ? row.module.trim() : "",
      cours: row.cours ? row.cours.trim() : "",
      question: row.question.trim(),
      options,
      correct,
      image, // <-- ici la valeur exacte, ex: "c1qs2.svg"
    };
  })
  .filter((q) => q !== null); // enlever les null (questions vides)

// Sauvegarder dans ton dossier BACKEND
const outputPath = path.join(__dirname, "questions.json");
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), "utf-8");

console.log(`✅ Fichier JSON généré : ${outputPath}`);
