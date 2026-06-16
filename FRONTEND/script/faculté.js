const espacemodule=document.getElementById('nommodule');

const moduleNom = localStorage.getItem("selectedModuleNom");
if(moduleNom){
espacemodule.textContent = moduleNom;
}

const titre= document.getElementById('inscrivez');


  const button = document.querySelector('.c-button--gooey');
button.addEventListener('click', () => {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
});
const boutton=document.getElementById('boutton');



function getFacultyCheckboxes() {
  return Array.from(document.querySelectorAll('.checkb')).filter(cb => cb.id !== 'selectall');
}

function attachFacultyCheckboxLogic() {
  const selectall = document.getElementById('selectall');
  const checkboxes = getFacultyCheckboxes();
  if (!selectall) return;

  selectall.addEventListener('change', function () {
    checkboxes.forEach(cb => cb.checked = this.checked);
  });

  checkboxes.forEach(cb => {
    cb.addEventListener('change', function () {
      selectall.checked = checkboxes.length > 0 && checkboxes.every(c => c.checked);
    });
  });
}

// ─── Charger les facultés depuis la BDD ───────────────────────────
function chargerFacultes() {
  fetch('/api/facultes')
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      const container = document.getElementById('facultes-list');
      container.innerHTML = '';

      if (data.facultes.length === 0) {
        container.innerHTML = `
          <p style="color:#888; font-size:14px; text-align:center; padding:20px 0;">
            Aucune faculté disponible pour le moment.
          </p>
        `;
        return; // ← on s'arrête là, pas de rebind nécessaire
      }

      data.facultes.forEach(f => {
        const div = document.createElement('div');
        div.className = 'option1'; // garde ton style existant

        // Après
const checkId = `fac-${f.id}`;
div.innerHTML = `
  <p class="facoptions">${f.nom.toUpperCase()}</p>
  <label class="container2" for="${checkId}">
    <input class="checkb" id="${checkId}" type="checkbox" value="${f.id}">
    <div class="checkmark"></div>
  </label>
`;

// Rendre toute la barre cliquable
div.style.cursor = 'pointer';
div.addEventListener('click', function(e) {
  // Éviter le double-toggle si on clique directement sur le checkbox ou label
  if (e.target.classList.contains('checkb') || e.target.classList.contains('checkmark') || e.target.closest('label')) return;
  const cb = div.querySelector('.checkb');
  cb.checked = !cb.checked;
  cb.dispatchEvent(new Event('change', { bubbles: true }));
});

container.appendChild(div);

      });

      // ✅ Rebrancher les listeners APRÈS que les checkboxes sont dans le DOM
      attachFacultyCheckboxLogic();
    })
    .catch(err => {
      console.error('Erreur facultés :', err);
      // La page reste affichée, juste le container reste vide
    });
}

// ─── Listeners checkboxes (rebind après chargement dynamique) ─────
function rebindCheckboxes() {
  attachFacultyCheckboxLogic();
}

// Fonction de validation
function validerFacultes() {
  const facs = getFacultyCheckboxes()
                    .filter(cb => cb.checked)
                    .map(el => el.value); // ids numériques des facultés

  fetch('/api/choixfaculte', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ faculte: facs }),
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      localStorage.setItem('selectedFacultes', JSON.stringify(facs));
      window.location.href = 'cours.html';
    } else {
      alert('Erreur : ' + result.message);
    }
  })
  .catch(err => {
    console.error('Erreur réseau :', err);
    alert('Impossible de contacter le serveur.');
  });
}

boutton.addEventListener('click', function (event) {
  const checkboxes = getFacultyCheckboxes();
  const check = checkboxes.some(cb => cb.checked);

  if (!check) {
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
    validerFacultes();
  }
});

// GARDE juste ça dans DOMContentLoaded :
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loader").style.display = "none";
  document.getElementById("content").style.display = "block";
  setTimeout(() => titre.classList.add('slide-in'), 100);
  chargerFacultes(); // ← ajout
});