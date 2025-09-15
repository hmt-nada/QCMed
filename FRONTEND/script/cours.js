// =======================
// Données des cours
// =======================
const coursParModule = {
  // 1ère année médecine
  anatomie: [
    { id: "arteresdumembrepelvien", nom: "Artères du Membre Pelvien", facultes: ["annaba"] },
    { id: "arteresdumembrethoracique", nom: "Artères du Membre Thoracique", facultes: ["annaba"] },
    { id: "articulationdelacheville", nom: "Articulation de la Cheville", facultes: ["annaba"] },
    { id: "articulationdelahanche", nom: "Articulation de la Hanche", facultes: ["annaba"] },
   { id: "cours", nom: "cours", facultes: ["annaba"] },
  ],
  biochimie: [
    { id: "structuredesglucides", nom: "Structure des Glucides", facultes: ["annaba"] }
  ],
  // Les autres modules restent vides par défaut
  biophysique1: [{id:" ", nom:" "}],
  biostatistique1: [{id:" ", nom:" "}],
  chimie1: [{id:" ", nom:" "}],
  cytologie1: [{id:" ", nom:" "}],
  embriologie1: [{id:" ", nom:" "}],
  histologie1: [{id:" ", nom:" "}],
  physiologie1: [{id:" ", nom:" "}],
  ssh1: [{id:" ", nom:" "}],
  physiologie2: [{id:" ", nom:" "}],
  anatomie2: [{id:" ", nom:" "}],
  biochimie2: [{id:" ", nom:" "}],
  biophysique2: [{id:" ", nom:" "}],
  genetique2: [{id:" ", nom:" "}],
  genetiquediagest2: [{id:" ", nom:" "}],
  histologie2: [{id:" ", nom:" "}],
  immunologie2: [{id:" ", nom:" "}],
  immunologie3: [{id:" ", nom:" "}],
  anapath3: [{id:" ", nom:" "}],
  diagest3: [{id:" ", nom:" "}],
  bioch3: [{id:" ", nom:" "}],
  hyperqcm3: [{id:" ", nom:" "}],
  immunologiediagest3: [{id:" ", nom:" "}],
  microbio3: [{id:" ", nom:" "}],
  microbiodiagest3: [{id:" ", nom:" "}],
  parasitologiemycologie3: [{id:" ", nom:" "}],
  pharmacologie3: [{id:" ", nom:" "}],
  pharmacologiediagest3: [{id:" ", nom:" "}],
  physiopatologie3: [{id:" ", nom:" "}],
  psychologiemedicale3: [{id:" ", nom:" "}],
  radiologie3: [{id:" ", nom:" "}],
  semiologie3: [{id:" ", nom:" "}],
};

const moduleId = localStorage.getItem("selectedModuleId");

// =======================
// Fonction pour gérer les checkboxes
// =======================
function attachCheckboxLogic() {
  const checkboxes = document.querySelectorAll('.checkb');
  const selectall = document.getElementById('selectall');

  if(!selectall) return;

  // Tout sélectionner / désélectionner
  selectall.addEventListener('change', function() {
    checkboxes.forEach(cb => cb.checked = this.checked);
  });

  // Mise à jour dynamique du bouton "Tout sélectionner"
  checkboxes.forEach(cb => {
    cb.addEventListener('change', function () {
      selectall.checked = Array.from(checkboxes).every(c => c.checked);
    });
  });
}

// =======================
// Affichage des cours
// =======================
function afficherCours() {
  const moduleNom = localStorage.getItem("selectedModuleNom");
  const facs = JSON.parse(localStorage.getItem("selectedFacultes") || "[]");

  document.getElementById("nommodule").textContent = moduleNom;

  const cours = coursParModule[moduleId] || [];
  const coursFiltres = cours.filter(c => c.facultes.some(f => facs.includes(f)));

  const container = document.querySelector(".ajust");
  container.querySelectorAll(".cours").forEach(e => e.remove());

  facs.forEach(faculte => {
    fetch(`/stats/questions-par-cours?module=${moduleId}&faculte=${faculte}`)
      .then(res => res.json())
      .then(stats => {
        const statsMap = {};
        stats.forEach(s => { statsMap[s.cours] = s.nombre_questions; });

        coursFiltres.forEach((c, index) => {
          if (!c.facultes.includes(faculte)) return;

          const nbQuestions = statsMap[c.id] || 0;

          const div = document.createElement("div");
          div.className = `cours${index + 1} cours`;

          div.innerHTML = `
            <p class="facoptions">
              ${c.nom} <span class="cours-questions">(${nbQuestions || 0} questions)</span>
            </p>
            <label class="container2">
              <input class="checkb" type="checkbox" value="${c.id}">
              <div class="checkmark"></div>
            </label>
          `;
          container.appendChild(div);
        });

        attachCheckboxLogic(); // ⚡ Attacher les événements après génération
      })
      .catch(err => console.error("Erreur récupération stats :", err));
  });
}

// =======================
// Validation des cours
// =======================
function validerCours() {
  const moduleNom = localStorage.getItem("selectedModuleNom");
  const checkboxes = document.querySelectorAll('.checkb');
  const cours = Array.from(checkboxes)
                     .filter(cb => cb.checked)
                     .map(cb => cb.value)
                     .filter(val => val !== "on");

  if(cours.length === 0){
    alert("⚠️ Sélectionnez au moins un cours !");
    return;
  }

  fetch("/api/choixcours", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cours }),
  })
  .then(res => res.json())
  .then(result => {
    if(result.success){
      localStorage.setItem("selectedModule", moduleNom);
      window.location.href = "caracteristique.html";
    } else {
      alert("Erreur: " + result.message);
    }
  })
  .catch(err => {
    console.error(err);
    alert("Impossible de contacter le serveur");
  });
}

// =======================
// Bouton Valider avec animation
// =======================
document.getElementById('boutton').addEventListener('click', function(event){
  const checkboxes = document.querySelectorAll('.checkb');
  const anyChecked = Array.from(checkboxes).some(cb => cb.checked);

  if(!anyChecked){
    event.preventDefault();
    checkboxes.forEach(box => {
      const mark = box.parentElement.querySelector('.checkmark');
      if(mark){
        mark.classList.add('shake');
        mark.style.setProperty('--clr','red');
        setTimeout(() => {
          mark.classList.remove('shake');
          mark.style.setProperty('--clr','#161D6F');
        }, 500);
      }
    });
  } else {
    validerCours();
  }
});

// =======================
// Animation titre & bouton
// =======================
const titre = document.getElementById('inscrivez');
window.addEventListener('load', () => {
  
  

  const button = document.querySelector('.c-button--gooey');
  if(button){
    button.addEventListener('click', () => {
      button.classList.add('clicked');
      setTimeout(()=>button.classList.remove('clicked'), 200);
    });
  }
});

// =======================
// Récupération utilisateur et affichage des cours
// =======================
window.addEventListener("DOMContentLoaded", () => {
  fetch("/api/utilisateur", {
  method: "GET",
  credentials: "include" // 👈 envoie le cookie de session
})
    .then(res => res.json())
    .then(result => {
      if(result.success){
        const user = result.utilisateur;
        document.getElementById("avatar").src = user.avatar;
        document.getElementById("pseudo").textContent = user.pseudo;
        afficherCours();
        // Une fois prêt → cacher le loader et montrer la page
      document.getElementById("loader").style.display = "none";
      document.getElementById("content").style.display = "block";
       setTimeout(() => {
    titre.classList.add('slide-in');
  }, 100); // 100ms suffit

      } else {
        document.getElementById("pseudo").textContent = "Inconnu";
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById("pseudo").textContent = "Erreur";
      // Une fois prêt → cacher le loader et montrer la page
      document.getElementById("loader").style.display = "block";
      document.getElementById("content").style.display = "none";
    });
});
