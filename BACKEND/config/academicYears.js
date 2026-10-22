// ═══════════════════════════════════════════════════════════════════════════
// Configuration centralisée des années universitaires disponibles sur QCMed
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Liste des années actuellement ouvertes et disposant de données (modules/cours/QCM).
 * Pour ouvrir une nouvelle année (ex: 2ème année), il suffit d'ajouter son numéro ici :
 * ex: const AVAILABLE_YEARS = [1, 2];
 */
const AVAILABLE_YEARS = [1];

/**
 * Année par défaut utilisée pour les inscriptions et comme repli (fallback)
 * sécurisé pour les comptes existants ayant une année non encore disponible.
 */
const DEFAULT_YEAR = 1;

/**
 * Libellés officiels d'affichage pour chaque année médicale.
 */
const YEAR_LABELS = {
  1: '1ère Année',
  2: '2ème Année',
  3: '3ème Année',
  4: '4ème Année',
  5: '5ème Année',
  6: '6ème Année',
  7: '7ème Année',
};

/**
 * Détermine l'année effective d'un utilisateur ou d'une valeur brute d'année.
 * Si l'année de l'utilisateur fait partie des années disponibles, elle est retournée.
 * Sinon, DEFAULT_YEAR (1) est retournée afin d'éviter tout écran vide.
 *
 * @param {Object|number|string|null|undefined} userOrYear - Objet utilisateur (contenant .annee) ou valeur d'année
 * @returns {number} Année effective (entier)
 */
function getEffectiveYear(userOrYear) {
  if (userOrYear === null || userOrYear === undefined) {
    return DEFAULT_YEAR;
  }

  let raw = userOrYear;
  if (typeof userOrYear === 'object') {
    raw = userOrYear.annee;
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return AVAILABLE_YEARS.includes(raw) ? raw : DEFAULT_YEAR;
  }

  if (typeof raw === 'string') {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && AVAILABLE_YEARS.includes(parsed)) {
      return parsed;
    }
    const match = raw.match(/\d+/);
    if (match) {
      const matchNum = parseInt(match[0], 10);
      if (AVAILABLE_YEARS.includes(matchNum)) {
        return matchNum;
      }
    }
  }

  return DEFAULT_YEAR;
}

/**
 * Vérifie si une année est actuellement autorisée / disponible.
 * @param {number|string} year 
 * @returns {boolean}
 */
function isYearAvailable(year) {
  const num = typeof year === 'number' ? year : parseInt(year, 10);
  return AVAILABLE_YEARS.includes(num);
}

module.exports = {
  AVAILABLE_YEARS,
  DEFAULT_YEAR,
  YEAR_LABELS,
  getEffectiveYear,
  isYearAvailable,
};
