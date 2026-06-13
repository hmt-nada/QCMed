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
const checkboxes = document.querySelectorAll('.checkb');
const boutton=document.getElementById('boutton');
const selectall=document.getElementById('selectall');
selectall.addEventListener('change',function(){

checkboxes.forEach((a)=>{

  a.checked=this.checked;
});

});
checkboxes.forEach((cb) => {
  cb.addEventListener('change', function () {
    if (!this.checked) {
      selectall.checked = false;
    } else {
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      selectall.checked = allChecked;
    }
  });
});

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

        div.innerHTML = `
          <p class="facoptions">${f.nom.toUpperCase()}</p>
          <label class="container2">
            <input class="checkb" type="checkbox" value="${f.id}">
            <div class="checkmark"></div>
          </label>
        `;
        container.appendChild(div);
      });

      // ✅ Rebrancher les listeners APRÈS que les checkboxes sont dans le DOM
      rebindCheckboxes();
    })
    .catch(err => {
      console.error('Erreur facultés :', err);
      // La page reste affichée, juste le container reste vide
    });
}

// ─── Listeners checkboxes (rebind après chargement dynamique) ─────
function rebindCheckboxes() {
  const checkboxes = document.querySelectorAll('.checkb');
  const selectall  = document.getElementById('selectall');

  selectall.addEventListener('change', function () {
    checkboxes.forEach(cb => cb.checked = this.checked);
  });

  checkboxes.forEach(cb => {
    cb.addEventListener('change', function () {
      if (!this.checked) {
        selectall.checked = false;
      } else {
        selectall.checked = Array.from(checkboxes).every(cb => cb.checked);
      }
    });
  });
}

// Fonction de validation
function validerFacultes() {
  const facs = Array.from(document.querySelectorAll('.checkb:checked'))
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
  const checkboxes = document.querySelectorAll('.checkb'); // ← lu après chargement
  const check = Array.from(checkboxes).some(cb => cb.checked);

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