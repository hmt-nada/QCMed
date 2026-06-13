/* ============================================================
   FAQ.js — QCMed
   Accordéon + recherche live
   ============================================================ */

const CHEVRON_SVG = `
  <svg viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
`;

/* ---------- Données ---------- */
const faqData = [
  {
    cat: "Compte & profil",
    items: [
      {
        q: "Puis-je modifier mes informations personnelles ?",
        a: "Oui, connectez-vous à votre espace utilisateur, allez dans « Mon Profil » puis modifiez vos informations (modification, suppression, déconnexion)."
      },
      {
        q: "Est-ce que mon compte est visible par les autres utilisateurs ?",
        a: "Non, votre compte reste strictement privé et n'est jamais partagé."
      },
      {
        q: "Dois-je obligatoirement activer mon compte par email ?",
        a: "Oui, l'activation par email est obligatoire. Sans activation, vous n'aurez pas accès et le compte sera automatiquement supprimé au bout de 24 h."
      },
      {
        q: "Puis-je changer mon adresse email plus tard ?",
        a: "Oui, mais vous devrez confirmer la nouvelle adresse via un lien d'activation. Tant que vous n'avez pas validé, l'ancienne adresse reste active."
      },
      {
        q: "Puis-je modifier mon année scolaire après inscription ?",
        a: "Non. L'année est fixée au moment de l'inscription. À chaque rentrée, vous recevrez un email pour passer au niveau supérieur ou recommencer la même année. En cas de situation particulière, contactez-nous."
      }
    ]
  },
  {
    cat: "Contenu & QCM",
    items: [
      {
        q: "Quelles sont les sources des QCM sur QCMed ?",
        a: "Les QCM proviennent des examens précédents des facultés de médecine en Algérie (actuellement Annaba et Skikda). Les autres facultés seront ajoutées progressivement."
      },
      {
        q: "Vais-je obtenir une note à la fin du QCM ?",
        a: "En mode correction, vous obtiendrez une note selon le mode choisi. Sinon, vous recevrez uniquement un retour sur vos réponses."
      },
      {
        q: "Puis-je poser mes propres questions sur le contenu ?",
        a: "Oui, via la section « Contact » ou en utilisant « Signaler une faute dans une question » en cours de QCM."
      }
    ]
  },
  {
    cat: "Fonctionnalités & technique",
    items: [
      {
        q: "Le site QCMed est-il gratuit ?",
        a: "Oui, l'accès aux contenus de base est entièrement gratuit. Certains modules avancés pourront être proposés en version premium à l'avenir."
      },
      {
        q: "Est-ce que le site est accessible sur mobile ?",
        a: "Oui, QCMed est optimisé pour smartphones, tablettes et ordinateurs."
      },
      {
        q: "Y a-t-il une application mobile QCMed ?",
        a: "Pour le moment, QCMed est accessible via navigateur mobile. Une application dédiée est en cours de développement."
      },
      {
        q: "Y a-t-il une page de statistiques ?",
        a: "Oui, une page statistique est en cours de développement. Elle permettra de suivre vos résultats, vos progrès et vos points faibles."
      },
      {
        q: "Qui peut utiliser QCMed ?",
        a: "Le site est destiné aux étudiants en médecine en Algérie, mais certaines ressources peuvent être utiles à d'autres étudiants en sciences de la santé."
      }
    ]
  },
  {
    cat: "Support",
    items: [
      {
        q: "Comment contacter le support ?",
        a: 'Vous pouvez nous contacter via la section « Contact » ou envoyer un email à <a href="mailto:qcmed.2025@gmail.com">qcmed.2025@gmail.com</a>.'
      },
      {
        q: "Autres questions ?",
        a: 'Si vous avez d\'autres questions, n\'hésitez pas à nous contacter via la page <a href="contact.html">Contactez-nous</a>.'
      }
    ]
  }
];

/* ---------- State ---------- */
const listEl   = document.getElementById('faq-list');
const searchEl = document.getElementById('faq-search');
let openItem   = null;

/* ---------- Construction de la liste ---------- */
function buildFaq(filter) {
  listEl.innerHTML = '';
  const q   = (filter || '').trim().toLowerCase();
  let found = false;

  faqData.forEach(function(section) {
    const filtered = section.items.filter(function(item) {
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });

    if (!filtered.length) return;
    found = true;

    /* Label de section (masqué en mode recherche) */
    if (!q) {
      const label = document.createElement('p');
      label.className = 'section-label';
      label.textContent = section.cat;
      listEl.appendChild(label);
    }

    filtered.forEach(function(data) {
      const item = createItem(data.q, data.a);
      listEl.appendChild(item);
    });
  });

  if (!found) {
    listEl.innerHTML =
      '<div class="faq-empty">' +
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01"/></svg>' +
        'Aucun résultat pour « ' + filter + ' ».' +
      '</div>';
  }
}

/* ---------- Création d'un item ---------- */
function createItem(question, answer) {
  const item = document.createElement('div');
  item.className = 'faq-item';

  /* Bouton question */
  const btn = document.createElement('div');
  btn.className = 'faq-q';
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML =
    '<span class="faq-q-text">' + question + '</span>' +
    '<span class="faq-chevron">' + CHEVRON_SVG + '</span>';

  /* Réponse */
  const aWrap = document.createElement('div');
  aWrap.className = 'faq-a';

  const aInner = document.createElement('div');
  aInner.className = 'faq-a-inner';
  aInner.innerHTML = answer;
  aWrap.appendChild(aInner);

  /* Événements */
  btn.addEventListener('click', function() {
    toggle(item, btn, aWrap);
  });

  btn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(item, btn, aWrap);
    }
  });

  item.appendChild(btn);
  item.appendChild(aWrap);
  return item;
}

/* ---------- Accordéon ---------- */
function toggle(item, btn, aWrap) {
  const isOpen = item.classList.contains('open');

  /* Fermer l'item précédent */
  if (openItem && openItem !== item) {
    openItem.classList.remove('open');
    openItem.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    openItem.querySelector('.faq-a').style.maxHeight = '0';
  }

  if (isOpen) {
    item.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    aWrap.style.maxHeight = '0';
    openItem = null;
  } else {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    aWrap.style.maxHeight = aWrap.scrollHeight + 'px';
    openItem = item;
  }
}

/* ---------- Recherche live ---------- */
searchEl.addEventListener('input', function() {
  openItem = null;
  buildFaq(searchEl.value);
});

/* ---------- Init ---------- */
buildFaq('');