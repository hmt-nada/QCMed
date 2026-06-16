const moduleId  = localStorage.getItem("selectedModuleId");
const moduleNom = localStorage.getItem("selectedModuleNom");
const titre     = document.getElementById('inscrivez');

// =======================
// Checkboxes logic
// =======================
function getCourseCheckboxes() {
  return Array.from(document.querySelectorAll('.checkb')).filter(cb => cb.id !== 'selectall');
}

function attachCheckboxLogic() {
  const courseCheckboxes = getCourseCheckboxes();
  const selectall        = document.getElementById('selectall');
  if (!selectall) return;

  selectall.addEventListener('change', function () {
    courseCheckboxes.forEach(cb => cb.checked = this.checked);
  });

  courseCheckboxes.forEach(cb => {
    cb.addEventListener('change', function () {
      selectall.checked = courseCheckboxes.length > 0 && courseCheckboxes.every(c => c.checked);
    });
  });
}

// =======================
// Affichage cours depuis BDD
// =======================
function afficherCours() {
  document.getElementById("nommodule").textContent = moduleNom;

  const container = document.querySelector(".ajust");
  container.querySelectorAll(".cours").forEach(e => e.remove());

  // 1. Charger les cours filtrés (module + facultés depuis session)
  fetch('/api/cours')
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      if (data.cours.length === 0) {
        container.insertAdjacentHTML('beforeend', `
          <p style="color:#888; font-size:14px; text-align:center; padding:20px 0;">
            Aucun cours disponible pour ce module.
          </p>
        `);
        return;
      }

      // 2. Charger les stats (nombre de questions par cours)
      fetch('/api/questions-par-cours')
        .then(res => res.json())
        .then(stats => {
          const statsMap = {};
          stats.forEach(s => { statsMap[s.id] = s.nombre_questions; });

          data.cours.forEach((c, index) => {
            const nbQuestions = statsMap[c.id] || 0;

            const div = document.createElement("div");
            div.className = `cours${index + 1} cours`;

            // Après
const checkId = `cours-${c.id}`;
div.innerHTML = `
  <p class="facoptions">
    ${c.titre}
    <span class="cours-questions">(${nbQuestions} questions)</span>
  </p>
  <label class="container2" for="${checkId}">
    <input class="checkb" id="${checkId}" type="checkbox" value="${c.id}">
    <div class="checkmark"></div>
  </label>
`;

div.style.cursor = 'pointer';
div.addEventListener('click', function(e) {
  if (e.target.classList.contains('checkb') || e.target.classList.contains('checkmark') || e.target.closest('label')) return;
  const cb = div.querySelector('.checkb');
  cb.checked = !cb.checked;
  cb.dispatchEvent(new Event('change', { bubbles: true }));
});

container.appendChild(div);
          });

          attachCheckboxLogic();
        })
        .catch(err => console.error("Erreur stats :", err));
    })
    .catch(err => console.error('Erreur cours :', err));
}

// =======================
// Validation
// =======================
function validerCours() {
  const checkboxes = getCourseCheckboxes();
  const cours = checkboxes
                     .filter(cb => cb.checked)
                     .map(cb => cb.value)
                     .filter(v => v && v.trim() !== '');

  fetch('/api/choixcours', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cours }),
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      window.location.href = 'caracteristique.html';
    } else {
      alert('Erreur : ' + result.message);
    }
  })
  .catch(err => {
    console.error(err);
    alert('Impossible de contacter le serveur.');
  });
}

// =======================
// Bouton suivant
// =======================
document.getElementById('boutton').addEventListener('click', function (event) {
  const checkboxes = getCourseCheckboxes();
  const anyChecked = checkboxes.some(cb => cb.checked);

  if (!anyChecked) {
    event.preventDefault();
    checkboxes.forEach(box => {
      const mark = box.parentElement.querySelector('.checkmark');
      if (mark) {
        mark.classList.add('shake');
        mark.style.setProperty('--clr', 'red');
        setTimeout(() => {
          mark.classList.remove('shake');
          mark.style.setProperty('--clr', '#161D6F');
        }, 500);
      }
    });
  } else {
    validerCours();
  }
});

// =======================
// Animation bouton
// =======================
const button = document.querySelector('.c-button--gooey');
if (button) {
  button.addEventListener('click', () => {
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 200);
  });
}

// =======================
// Init
// =======================
document.addEventListener('utilisateurCharge', () => {
  afficherCours();
  document.getElementById("loader").style.display = "none";
  document.getElementById("content").style.display = "block";
  setTimeout(() => titre.classList.add('slide-in'), 100);
});