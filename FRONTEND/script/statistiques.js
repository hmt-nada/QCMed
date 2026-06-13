/* ============================
   statistiques.js — QCMed
   ============================ */

// Palette couleurs pour les barres modules (cycle)
const COLORS = ['#3b5bdb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];

// DOM refs
const loader        = document.getElementById('loader');
const emptyState    = document.getElementById('emptyState');
const ringFill      = document.getElementById('ringFill');
const ringVal       = document.getElementById('ringVal');
const kpiSessions   = document.getElementById('kpiSessions');
const kpiBest       = document.getElementById('kpiBest');
const kpiMoyenne    = document.getElementById('kpiMoyenne');
const modulesList   = document.getElementById('modulesList');

// Sections à masquer pendant le chargement
const heroSection    = document.querySelector('.hero-section');
const kpiStrip       = document.querySelector('.kpi-strip');
const chartSection   = document.querySelector('.chart-section');
const modulesSection = document.querySelector('.modules-section');

let evolutionChart = null;

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  hideContent();
  loadStats();
});

// ── Chargement ───────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch('/api/statistiques', { credentials: 'include' });
    if (res.status === 401) { window.location.href = 'connexion.html'; return; }
    if (!res.ok) throw new Error('Erreur serveur');

    const data = await res.json();

    if (!data.total_sessions || data.total_sessions === 0) {
      showEmpty();
      return;
    }

    showContent();
    renderRing(data.taux_global);
    renderKPIs(data);
    renderEvolution(data.evolution ?? []);
    renderModules(data.par_module ?? []);

  } catch (err) {
    console.error(err);
    showEmpty();
  } finally {
    loader.classList.add('hidden');
  }
}

// ── Anneau ───────────────────────────────────────────────────────────────────
function renderRing(tauxGlobal) {
  // taux_global = 0..100 (%)
  const pct  = Math.min(100, Math.max(0, tauxGlobal ?? 0));
  const circ = 515.2; // 2π × 82
  const offset = circ - (pct / 100) * circ;

  // Couleur selon score
  let cls = 'faible';
  if (pct >= 80) cls = 'excellent';
  else if (pct >= 60) cls = 'bien';
  else if (pct >= 40) cls = 'moyen';
  ringFill.classList.add(cls);

  // Animation après un court délai (laisser le temps au browser de peindre)
  requestAnimationFrame(() => {
    setTimeout(() => {
      ringFill.style.strokeDashoffset = offset;
    }, 120);
  });

  // Compteur animé
  animateCounter(ringVal, 0, Math.round(pct), 1300, v => v + '%');
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
function renderKPIs(data) {
  kpiSessions.textContent = data.total_sessions ?? '—';
  kpiBest.textContent     = data.meilleure_note !== null
    ? parseFloat(data.meilleure_note).toFixed(1) + '/20'
    : '—';
  kpiMoyenne.textContent  = data.moyenne_generale !== null
    ? parseFloat(data.moyenne_generale).toFixed(1) + '/20'
    : '—';
}

// ── Graphe évolution ─────────────────────────────────────────────────────────
function renderEvolution(evolution) {
  // evolution = [{date, note, module_nom}, ...] ORDER BY created_at ASC, max 20
  if (!evolution.length) {
    chartSection.classList.add('hidden');
    return;
  }

  const labels = evolution.map(e => formatDateShort(e.created_at));
  const notes  = evolution.map(e => parseFloat(e.note));

  const ctx = document.getElementById('evolutionChart').getContext('2d');

  // Gradient sous la courbe
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(59,91,219,0.25)');
  gradient.addColorStop(1, 'rgba(59,91,219,0)');

  evolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Note /20',
        data: notes,
        borderColor: '#3b5bdb',
        backgroundColor: gradient,
        borderWidth: 2.5,
        pointBackgroundColor: notes.map(n => pointColor(n)),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a237e',
          titleColor: '#fff',
          bodyColor: '#c5cef7',
          padding: 10,
          borderRadius: 8,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex;
              return evolution[idx]?.module_nom ?? items[0].label;
            },
            label: (item) => ` ${item.raw.toFixed(1)} / 20`,
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Poppins', size: 11 },
            color: '#9ca3af',
            maxRotation: 0,
            maxTicksLimit: 8,
          }
        },
        y: {
          min: 0, max: 20,
          grid: { color: '#f0f2f8', lineWidth: 1 },
          ticks: {
            font: { family: 'Poppins', size: 11 },
            color: '#9ca3af',
            stepSize: 5,
            callback: v => v + '/20'
          }
        }
      }
    }
  });
}

// ── Barres modules ───────────────────────────────────────────────────────────
function renderModules(modules) {
  // modules = [{module_nom, taux_reussite (0-100), total_questions, total_sessions}, ...]
  if (!modules.length) {
    modulesSection.classList.add('hidden');
    return;
  }

  // Trier par taux décroissant
  const sorted = [...modules].sort((a, b) => b.taux_reussite - a.taux_reussite);

  modulesList.innerHTML = '';
  sorted.forEach((m, i) => {
    const pct   = Math.round(m.taux_reussite ?? 0);
    const color = COLORS[i % COLORS.length];

    const row = document.createElement('div');
    row.className = 'module-row';
    row.innerHTML = `
      <div class="module-row-header">
        <span class="module-nom">${escHtml(m.module_nom)}</span>
        <span class="module-meta">${pct}% · ${m.total_sessions ?? 0} session${(m.total_sessions ?? 0) > 1 ? 's' : ''}</span>
      </div>
      <div class="barre-bg">
        <div class="barre-fill" style="background:${color}" data-pct="${pct}"></div>
      </div>
    `;
    modulesList.appendChild(row);
  });

  // Animer les barres avec IntersectionObserver
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.barre-fill').forEach(b => {
          b.style.width = b.dataset.pct + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.module-row').forEach(r => observer.observe(r));
}

// ── Utilitaires ──────────────────────────────────────────────────────────────
function pointColor(note) {
  if (note >= 16) return '#10b981';
  if (note >= 12) return '#3b5bdb';
  if (note >= 8)  return '#f59e0b';
  return '#ef4444';
}

function animateCounter(el, from, to, duration, format = v => v) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    el.textContent = format(Math.round(from + (to - from) * ease));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function hideContent() {
  [heroSection, kpiStrip, chartSection, modulesSection].forEach(el => el?.classList.add('hidden'));
}
function showContent() {
  [heroSection, kpiStrip, chartSection, modulesSection].forEach(el => el?.classList.remove('hidden'));
}
function showEmpty() {
  emptyState.classList.remove('hidden');
  [heroSection, kpiStrip, chartSection, modulesSection].forEach(el => el?.classList.add('hidden'));
}