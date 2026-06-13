/* =====================================================
   favoris.js — QCMed
   Charge les favoris, permet de répondre + voir
   la correction, et de retirer un favori.
   ===================================================== */

const lettres = ['A', 'B', 'C', 'D', 'E', 'F'];

// ─── Toast ────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2200);
}

// ─── Remplir le select modules ────────────────────────────────────
function remplirFiltreModules(favoris) {
  const sel = document.getElementById('filter-module');
  const modules = [...new Set(favoris.map(f => f.module))].sort();
  modules.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    sel.appendChild(opt);
  });
}

// ─── Filtrage ─────────────────────────────────────────────────────
function filtrer(favoris) {
  const search = document.getElementById('search-favori').value.toLowerCase().trim();
  const module = document.getElementById('filter-module').value;

  return favoris.filter(f => {
    const matchSearch = !search || f.question.toLowerCase().includes(search);
    const matchModule = !module || f.module === module;
    return matchSearch && matchModule;
  });
}

// ─── Construire une carte favori ──────────────────────────────────
function creerCarte(favori) {
  // État local de la carte
  const etat = {
    reponsesChoisies: [],  // indices sélectionnés
    correctionVisible: false,
    verrouille: false
  };

  const card = document.createElement('div');
  card.className = 'favori-card';
  card.dataset.id = favori.id;

  // ── EN-TÊTE ──
  const header = document.createElement('div');
  header.className = 'card-header';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `
    <span class="tag-module">${favori.module}</span>
    <span class="tag-cours">${favori.cours}</span>
  `;

  const btnRetirer = document.createElement('button');
  btnRetirer.className = 'btn-retirer';
  btnRetirer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
         fill="#9fa8da" stroke="#9fa8da" stroke-width="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
    Retirer
  `;
  btnRetirer.addEventListener('click', () => retirerFavori(favori.id, card));

  header.appendChild(meta);
  header.appendChild(btnRetirer);

  // ── CORPS ──
  const body = document.createElement('div');
  body.className = 'card-body';

  // Image
  if (favori.image) {
    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = favori.image;
    img.alt = 'Illustration';
    body.appendChild(img);
  }

  // Énoncé
  const enonce = document.createElement('p');
  enonce.className = 'card-enonce';
  enonce.textContent = favori.question;
  body.appendChild(enonce);

  // Réponses
  const reponsesWrap = document.createElement('div');
  reponsesWrap.className = 'card-reponses';

  favori.reponses.forEach((texte, i) => {
    const item = document.createElement('div');
    item.className = 'reponse-item';
    item.dataset.index = i;
    item.innerHTML = `
      <span class="lettre">${lettres[i]}</span>
      <p>${texte}</p>
    `;

    item.addEventListener('click', () => {
      if (etat.verrouille) return;

      // Toggle sélection
      if (etat.reponsesChoisies.includes(i)) {
        etat.reponsesChoisies = etat.reponsesChoisies.filter(x => x !== i);
        item.classList.remove('active');
      } else {
        etat.reponsesChoisies.push(i);
        item.classList.add('active');
      }
    });

    reponsesWrap.appendChild(item);
  });

  body.appendChild(reponsesWrap);

  // ── ACTIONS ──
  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const btnCorrection = document.createElement('button');
  btnCorrection.className = 'btn-voir-correction';
  btnCorrection.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    Voir la correction
  `;

  const btnReinit = document.createElement('button');
  btnReinit.className = 'btn-reinit';
  btnReinit.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
    </svg>
    Réinitialiser
  `;

  // Correction
  btnCorrection.addEventListener('click', () => {
    if (etat.correctionVisible) return;
    etat.verrouille = true;
    etat.correctionVisible = true;

    const items = reponsesWrap.querySelectorAll('.reponse-item');
    items.forEach((item, i) => {
      item.classList.remove('active');
      const choisi   = etat.reponsesChoisies.includes(i);
      const correct  = favori.corrects.includes(i);

      if (choisi && correct)  item.classList.add('correct');
      if (choisi && !correct) item.classList.add('wrong');
      if (!choisi && correct) item.classList.add('missed');
    });

    // Afficher explication
    if (favori.explication) {
      explication.classList.add('visible');
    }

    btnCorrection.disabled = true;
    btnCorrection.style.opacity = '0.5';
  });

  // Réinitialiser
  btnReinit.addEventListener('click', () => {
    etat.reponsesChoisies  = [];
    etat.correctionVisible = false;
    etat.verrouille        = false;

    const items = reponsesWrap.querySelectorAll('.reponse-item');
    items.forEach(item => {
      item.classList.remove('active', 'correct', 'wrong', 'missed');
    });

    explication.classList.remove('visible');
    btnCorrection.disabled    = false;
    btnCorrection.style.opacity = '1';
  });

  actions.appendChild(btnCorrection);
  actions.appendChild(btnReinit);
  body.appendChild(actions);

  // ── EXPLICATION ──
  const explication = document.createElement('div');
  explication.className = 'card-explication';
  explication.innerHTML = `
    <p class="explication-label">Explication</p>
    <p class="explication-texte">${favori.explication || 'Aucune explication disponible.'}</p>
  `;
  body.appendChild(explication);

  card.appendChild(header);
  card.appendChild(body);

  return card;
}

// ─── Retirer un favori ────────────────────────────────────────────
function retirerFavori(questionId, cardEl) {
  fetch('/api/favoris/supprimer', {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ question_id: questionId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Animation de suppression
      cardEl.style.transition = 'opacity 0.25s, transform 0.25s';
      cardEl.style.opacity    = '0';
      cardEl.style.transform  = 'translateY(-6px)';
      setTimeout(() => {
        cardEl.remove();
        // Mise à jour compteur
        const restant = document.querySelectorAll('.favori-card').length;
        document.getElementById('count-badge').textContent =
          `${restant} question${restant > 1 ? 's' : ''}`;
        // Afficher état vide si plus rien
        if (restant === 0) {
          document.getElementById('empty-state').style.display = 'block';
        }
      }, 250);
      showToast('Retiré des favoris');
    }
  })
  .catch(() => showToast('Erreur réseau'));
}

// ─── Afficher la liste ────────────────────────────────────────────
let tousLesFavoris = [];

function afficherFavoris(liste) {
  const container  = document.getElementById('favoris-list');
  const emptyState = document.getElementById('empty-state');
  container.innerHTML = '';

  if (liste.length === 0) {
    emptyState.style.display = 'block';
    document.getElementById('count-badge').textContent = '0 question';
    return;
  }

  emptyState.style.display = 'none';
  document.getElementById('count-badge').textContent =
    `${liste.length} question${liste.length > 1 ? 's' : ''}`;

  liste.forEach(f => container.appendChild(creerCarte(f)));
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/favoris', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('content').style.display = 'block';

      if (!data.success) {
        document.getElementById('empty-state').style.display = 'block';
        return;
      }

      tousLesFavoris = data.favoris;
      remplirFiltreModules(tousLesFavoris);
      afficherFavoris(tousLesFavoris);
    })
    .catch(() => {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      document.getElementById('empty-state').style.display = 'block';
    });

  // Filtres live
  document.getElementById('search-favori').addEventListener('input', () => {
    afficherFavoris(filtrer(tousLesFavoris));
  });

  document.getElementById('filter-module').addEventListener('change', () => {
    afficherFavoris(filtrer(tousLesFavoris));
  });
});