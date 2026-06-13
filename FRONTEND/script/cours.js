const moduleId  = localStorage.getItem("selectedModuleId");
const moduleNom = localStorage.getItem("selectedModuleNom");
const titre     = document.getElementById('inscrivez');

// =======================
// Checkboxes logic
// =======================
function attachCheckboxLogic() {
  const checkboxes = document.querySelectorAll('.checkb');
  const selectall  = document.getElementById('selectall');
  if (!selectall) return;

  selectall.addEventListener('change', function () {
    checkboxes.forEach(cb => cb.checked = this.checked);
  });

  checkboxes.forEach(cb => {
    cb.addEventListener('change', function () {
      selectall.checked = Array.from(checkboxes).every(c => c.checked);
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

            div.innerHTML = `
              <p class="facoptions">
                ${c.titre}
                <span class="cours-questions">(${nbQuestions} questions)</span>
              </p>
              <label class="container2">
                <input class="checkb" type="checkbox" value="${c.id}">
                <div class="checkmark"></div>
              </label>
            `;
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
  const checkboxes = document.querySelectorAll('.checkb');
  const cours = Array.from(checkboxes)
                     .filter(cb => cb.checked)
                     .map(cb => cb.value);

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
  const checkboxes = document.querySelectorAll('.checkb');
  const anyChecked = Array.from(checkboxes).some(cb => cb.checked);

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