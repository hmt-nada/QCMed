/* ============================
   historique.js — QCMed
   ============================ */

// ── Données globales ──────────────────────────────────────────────────────────
let allSessions = [];        // toutes les sessions brutes
let filteredSessions = [];   // sessions après filtres

// ── DOM refs ─────────────────────────────────────────────────────────────────
const sessionsList  = document.getElementById('sessionsList');
const emptyState    = document.getElementById('emptyState');
const loader        = document.getElementById('loader');
const searchInput   = document.getElementById('searchInput');
const filterNote    = document.getElementById('filterNote');
const statTotal     = document.getElementById('statTotal');
const statMoyenne   = document.getElementById('statMoyenne');
const statMeilleure = document.getElementById('statMeilleure');

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadHistorique();

  searchInput.addEventListener('input', applyFiltres);
  filterNote.addEventListener('change', applyFiltres);
});

// ── Chargement sessions ───────────────────────────────────────────────────────
async function loadHistorique() {
  showLoader(true);
  try {
    const res = await fetch('/api/historique', { credentials: 'include' });
    if (res.status === 401) {
      window.location.href = 'connexion.html';
      return;
    }
    if (!res.ok) throw new Error('Erreur serveur');

    allSessions = await res.json();
    filteredSessions = [...allSessions];
    updateStats(allSessions);
    renderSessions(filteredSessions);
  } catch (err) {
    console.error(err);
    showEmpty('erreur');
  } finally {
    showLoader(false);
  }
}

// ── Filtres ───────────────────────────────────────────────────────────────────
function applyFiltres() {
  const q    = searchInput.value.trim().toLowerCase();
  const note = filterNote.value;

  filteredSessions = allSessions.filter(s => {
    const matchTexte = !q || s.module_nom.toLowerCase().includes(q);

    const pct = noteEnPourcent(s.note);
    let matchNote = true;
    if (note === 'excellent') matchNote = pct >= 80;
    else if (note === 'bien')  matchNote = pct >= 60 && pct < 80;
    else if (note === 'moyen') matchNote = pct >= 40 && pct < 60;
    else if (note === 'faible') matchNote = pct < 40;

    return matchTexte && matchNote;
  });

  renderSessions(filteredSessions);
}

// ── Rendu liste ───────────────────────────────────────────────────────────────
function renderSessions(sessions) {
  sessionsList.innerHTML = '';

  if (!sessions.length) {
    showEmpty();
    return;
  }
  emptyState.classList.add('hidden');

  sessions.forEach(s => {
    const card = buildSessionCard(s);
    sessionsList.appendChild(card);
  });
}

// ── Construction d'une carte session ─────────────────────────────────────────
function buildSessionCard(s) {
  const pct      = noteEnPourcent(s.note);
  const classe   = classeNote(pct);
  const date     = formatDate(s.created_at);
  const nbQ      = s.total_questions ?? '—';

  const card = document.createElement('div');
  card.className = 'session-card';
  card.dataset.sessionId = s.id;

  card.innerHTML = `
    <div class="session-header">
      <div class="session-note-circle ${classe}">
        ${s.note !== null && s.note !== undefined ? parseFloat(s.note).toFixed(1) + '<small>/20</small>' : '—'}
      </div>
      <div class="session-info">
        <div class="session-module">${escHtml(s.module_nom ?? 'Module inconnu')}</div>
        <div class="session-meta">
          <span class="meta-tag">📅 ${date}</span>
          <span class="meta-tag">❓ ${nbQ} question${nbQ > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="session-actions">
        <span class="chevron">▼</span>
      </div>
    </div>
    <div class="session-body">
      <div class="questions-loader">
        <div class="spinner-sm"></div> Chargement des questions…
      </div>
      <div class="questions-list hidden"></div>
    </div>
  `;

  // Accordéon : toggle au clic sur le header
  const header = card.querySelector('.session-header');
  header.addEventListener('click', () => toggleSession(card, s.id));

  return card;
}

// ── Toggle accordéon ──────────────────────────────────────────────────────────
function toggleSession(card, sessionId) {
  const isOpen = card.classList.contains('open');

  // Fermer tous les autres
  document.querySelectorAll('.session-card.open').forEach(c => {
    if (c !== card) c.classList.remove('open');
  });

  if (isOpen) {
    card.classList.remove('open');
    return;
  }

  card.classList.add('open');

  // Charger les questions si pas encore chargées
  const qList = card.querySelector('.questions-list');
  if (!qList.dataset.loaded) {
    loadSessionDetail(card, sessionId);
  }
}

// ── Détail d'une session (questions) ─────────────────────────────────────────
async function loadSessionDetail(card, sessionId) {
  const qLoader = card.querySelector('.questions-loader');
  const qList   = card.querySelector('.questions-list');

  qLoader.classList.remove('hidden');
  qList.classList.add('hidden');

  try {
    const res = await fetch(`/api/historique/${sessionId}`, { credentials: 'include' });
    if (!res.ok) throw new Error();

    const questions = await res.json();
    qList.innerHTML = '';

    if (!questions.length) {
      qList.innerHTML = '<p style="color:#6b7280;font-size:0.85rem;padding:10px 0">Aucune question enregistrée pour cette session.</p>';
    } else {
      questions.forEach(q => {
        qList.appendChild(buildQuestionItem(q));
      });
    }

    qList.dataset.loaded = 'true';
  } catch {
    qList.innerHTML = '<p style="color:#ef4444;font-size:0.85rem;padding:10px 0">Impossible de charger les questions.</p>';
  } finally {
    qLoader.classList.add('hidden');
    qList.classList.remove('hidden');
  }
}

// ── Construction d'un item question ──────────────────────────────────────────
function buildQuestionItem(q) {
  // Colonnes possibles : enonce, choix_a..f, bonne_reponse, reponse_choisie, explication, correct
  const lettres   = ['A','B','C','D','E','F'];
  const choix     = {
    A: q.choix_a, B: q.choix_b, C: q.choix_c,
    D: q.choix_d, E: q.choix_e, F: q.choix_f
  };
  const bonnes    = (q.bonne_reponse ?? '').split(',').map(l => l.trim().toUpperCase());
  const choisies  = (q.reponse_choisie ?? '').split(',').map(l => l.trim().toUpperCase());

  const div = document.createElement('div');
  div.className = 'question-item';

  // Énoncé
  let html = `<div class="question-enonce">${escHtml(q.enonce)}</div><div class="question-choix">`;

  lettres.forEach(l => {
    const texte = choix[l];
    if (!texte) return;                         // choix nullable

    const estBonne   = bonnes.includes(l);
    const estChoisie = choisies.includes(l);

    let classe = 'choix-ligne';
    let icon   = '';

    if (estBonne) {
      classe += ' correct';
      icon   = estChoisie ? '✅' : '✔';
    } else if (estChoisie) {
      classe += ' mauvais';
      icon   = '❌';
    }

    html += `<div class="${classe}">
      <span class="choix-lettre">${l}.</span>
      <span>${escHtml(texte)}</span>
      ${icon ? `<span style="margin-left:auto">${icon}</span>` : ''}
    </div>`;
  });

  html += '</div>';

  // Explication
  if (q.explication) {
    html += `<div class="explication-box">
      <span class="explication-label">💡 Explication</span>
      ${escHtml(q.explication)}
    </div>`;
  }

  div.innerHTML = html;
  return div;
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function updateStats(sessions) {
  if (!sessions.length) return;

  statTotal.textContent = sessions.length;

  const pcts = sessions
    .map(s => noteEnPourcent(s.note))
    .filter(p => p !== null);

  if (pcts.length) {
    const moy = pcts.reduce((a,b) => a + b, 0) / pcts.length;
    // reconvertir % → /20 pour l'affichage
    statMoyenne.textContent   = ((moy / 100) * 20).toFixed(1) + '/20';
    statMeilleure.textContent = ((Math.max(...pcts) / 100) * 20).toFixed(1) + '/20';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * note = numeric (ex: 14.5 si sur 20, ou peut stocker directement le % selon BDD).
 * On essaie de déduire : si total_questions fourni et note semble sur total → on calcule %.
 * Sinon on suppose que note est déjà un %, ou qu'on ne peut pas calculer.
 */
function noteEnPourcent(note) {
  if (note === null || note === undefined) return null;
  return (parseFloat(note) / 20) * 100;
}

function classeNote(pct) {
  if (pct === null) return '';
  if (pct >= 80) return 'note-excellent';
  if (pct >= 60) return 'note-bien';
  if (pct >= 40) return 'note-moyen';
  return 'note-faible';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showLoader(visible) {
  loader.classList.toggle('hidden', !visible);
}

function showEmpty(type) {
  if (type === 'erreur') {
    emptyState.querySelector('.empty-title').textContent = 'Erreur de chargement';
    emptyState.querySelector('.empty-sub').textContent   = 'Impossible de récupérer votre historique. Réessayez plus tard.';
  }
  emptyState.classList.remove('hidden');
  sessionsList.innerHTML = '';
}