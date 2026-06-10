// Dictionnaire des modules par année
const modulesParAnnee = {
  1: [
    { id: "anatomie", nom: "Anatomie", img: "images/anatomie.svg" },
    { id: "biochimie", nom: "Biochimie", img: "images/biochimie.svg" },
    { id: "biophysique", nom: "Biophysique", img: "images/biophysique1.svg" },
    { id: "biostatistique1", nom: "Biostatistique", img: "images/statique.svg" },
    { id: "chimie1", nom: "Chimie", img: "images/chimie.svg" },
    { id: "cytologie1", nom: "Cytologie", img: "images/cytologie.svg" },
    { id: "embryologie1", nom: "Embryologie", img: "images/embrio1.svg" },
    { id: "histologie1", nom: "Histologie", img: "images/histo.svg" },
    { id: "physiologie1", nom: "Physiologie", img: "images/physio.svg" },
    { id: "ssh1", nom: "Santé,Société et Humanité", img: "images/ssh1.svg" }
  ],
  2: [
    { id: "physiologie2", nom: "Physiologie", img: "images/physio.svg" },
    { id: "anatomie2", nom: "Anatomie", img: "images/anatomie.svg" },
    { id: "biochimie2", nom: "Biochimie", img: "images/biochimie.svg" },
    { id: "biophysique2", nom: "Biophysique", img: "images/biophysique1.svg" },
    { id: "genetique2", nom: "Génétique", img: "images/genetic.svg" },
    { id: "genetiquediagest2", nom: "Génétique - Diagest", img: "images/diagest.svg" },
    { id: "histologie2", nom: "Histologie", img: "images/histo.svg" },
    { id: "immunologie2", nom: "Immunologie", img: "images/immunologie.svg" }
  ],
  3: [
    { id: "immunologie3", nom: "Immunologie", img: "images/immunologie.svg" },
    { id: "anapath3", nom: "Anatomie Pathologique", img: "images/anapath.svg" },
    { id: "diagest3", nom: "Anatomie Pathologique - Diagest", img: "images/diagest.svg" },
    { id: "bioch3", nom: "Biochimie", img: "images/biochimie.svg" },
    { id: "hyperqcm3", nom: "HyperQcm", img: "images/hyperqcm.svg" },
    { id: "immunologiediagest3", nom: "Immunologie - Diagest", img: "images/immunologiediagest.svg" },
    { id: "microbio3", nom: "Microbiologie", img: "images/microbiologie.svg" },
    { id: "microbiodiagest3", nom: "Microbiologie - Diagest", img: "images/microbiologiediagest.svg" },
    { id: "parasitologiemycologie3", nom: "Parasitologie - Mycologie", img: "images/parasitologiemycologie.svg" },
    { id: "pharmacologie3", nom: "Pharmacologie", img: "images/pharmacologie.svg" },
    { id: "pharmacologiediagest3", nom: "Pharmacologie - Diagest", img: "images/pharmacologiediagest.svg" },
    { id: "physiopatologie3", nom: "Physiopatologie", img: "images/physiopatologie.svg" },
    { id: "psychologiemedicale3", nom: "Psychologie Médicale", img: "images/psychologiemedicale.svg" },
    { id: "radiologie3", nom: "Radiologie", img: "images/radiologie.svg" },
    { id: "semiologie3", nom: "Sémiologie", img: "images/semiologie.svg" }     
     ]
};


 
   

function afficherModules(anneeTexte) {
  const annee = parseInt(anneeTexte, 10);
  const modules = modulesParAnnee[annee] || [];
  const container = document.getElementById("modules-list");
  container.innerHTML = "";

  let index = 0;
  let nbParLigne = 3;
  let ligneCount = 0;

  while (index < modules.length) {
    ligneCount++;
    const ligne = document.createElement("div");
    ligne.className = "ligne";

    for (let i = 0; i < nbParLigne && index < modules.length; i++, index++) {
      const m = modules[index];
      const moduleDiv = document.createElement("div");
      moduleDiv.className = "module-container";
      moduleDiv.dataset.nom = m.nom;
      moduleDiv.dataset.module = m.id.trim().toLowerCase(); // ✅ normalisé

      let imgClass = "module-img";
      let nameClass = "module-name";

      if (ligneCount % 2 === 0 && ligneCount >= 2) {
        imgClass = i === 0 ? "module-img2" : "module-img02";
        nameClass = i === 0 ? "module-name2" : "module-name3";
      } else if (ligneCount === 3) {
        imgClass = "module-img pos";
      }

      moduleDiv.innerHTML = `
        <div class="module-tooltip-container">
          <img 
            class="${imgClass}" 
            src="${m.img}" 
            onclick="choisirmodule('${m.id}', '${m.nom}')" 
            alt="${m.nom}"
          >
          <div class="${nameClass}">
            <p class="name-style">${m.nom}</p>
            <div class="module-cours">(0 cours)</div> <!-- ✅ afficher 0 dès le départ -->
          </div>
        </div>
      `;
      ligne.appendChild(moduleDiv);
    }

    container.appendChild(ligne);
    nbParLigne = nbParLigne === 3 ? 2 : 3;
  }

  // Charger les stats et mettre à jour
  fetch("/stats/cours-par-module")
    .then(res => res.json())
    .then(data => {
      data.forEach(item => {
        const moduleElement = document.querySelector(`[data-module="${item.module.trim().toLowerCase()}"]`);
        if (!moduleElement) {
          console.warn("Module non trouvé :", item.module);
          return;
        }
        const coursDiv = moduleElement.querySelector(".module-cours");
        if (coursDiv) {
          coursDiv.textContent = `( ${item.nombre_cours || 0} cours )`;
        }
      });
    })
    .catch(err => console.error("Erreur récupération stats :", err));
}

function activerRecherche() {
  const search = document.getElementById('search');

  search.addEventListener('input', function () {
    const valeur = search.value.toLowerCase();
    const modules = document.querySelectorAll('.module-container');

    let premierTrouve = null;

    modules.forEach((module) => {
      const nom = module.getAttribute('data-nom').toLowerCase();
      const image = module.querySelector("img");
      const name = module.querySelector("p");
      const barre = module.querySelector("div");

      // Réinitialiser l'état
      name.classList.remove("highlight");
      image.classList.remove("hovering");
      barre.classList.remove("highlight");

      // Appliquer si correspondance
      if (valeur !== "" && nom.includes(valeur)) {
        if (!premierTrouve) {
          premierTrouve = module; // mémorise le premier
        }
        image.classList.add("hovering");
        barre.classList.add("highlight");
      }
    });

    // Scroll uniquement vers le premier trouvé
    if (premierTrouve) {
      premierTrouve.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}
const titre= document.getElementById('inscrivez');

const mainbox = document.getElementById('mainbox');

function updateActiveState() {
  if (search === document.activeElement || search.value.trim() !== "") {
    mainbox.classList.add('active');
  } else {
    mainbox.classList.remove('active');
  }
}

// Quand on clique dans la barre
search.addEventListener('focus', updateActiveState);
// Quand on quitte la barre
search.addEventListener('blur', () => {
  // délai court pour permettre le clic ailleurs avant de fermer
  setTimeout(updateActiveState, 100);
});

// Quand on tape dedans
search.addEventListener('input', updateActiveState);


//afficher le pseudo et avatar 

  function onUtilisateurCharge(user) {
  document.getElementById("pseudo2").textContent = user.pseudo;
  afficherModules(user.annee);
  activerRecherche();
  document.getElementById("loader").style.display = "none";
  document.getElementById("content").style.display = "block";
  setTimeout(() => titre.classList.add('slide-in'), 100);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('emailChanged') === 'true') {
    const alertBox = document.createElement('div');
    alertBox.innerText = "Votre adresse e-mail a bien été changée !";
    alertBox.style.cssText = `
      position:fixed; top:0; left:50%; transform:translateX(-50%);
      background:#28a745; color:white; padding:15px 25px;
      font-size:18px; font-weight:bold; border-radius:0 0 8px 8px;
      z-index:1000; box-shadow:0 2px 6px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(alertBox);
    setTimeout(() => {
      alertBox.remove();
      window.history.replaceState({}, document.title, "/");
    }, 5000);
  }
}

if (window._utilisateurChargeData) {
  onUtilisateurCharge(window._utilisateurChargeData);
} else {
  document.addEventListener('utilisateurCharge', (e) => {
    onUtilisateurCharge(e.detail);
  });
}

function choisirmodule(moduleId, moduleNom){
  const data = { module: moduleId };
  console.log("DATA ENVOYÉ :", data); 

  fetch(`/api/choixmodule`, {
    method:"post",
    headers:{ "content-type":"application/json" },
    body:JSON.stringify(data),
  })
  .then(response=>response.json())
  .then(result =>{
    if (result.success){   
        // stocker aussi le nom affiché
        localStorage.setItem("selectedModuleId", moduleId);
        localStorage.setItem("selectedModuleNom", moduleNom);

        window.location.href = "faculté.html";  
    } else {
      alert("erreur:"+result.message);
    }
  })
  .catch(error=>{
    console.error("erreur lors de l'envoi:",error);
    alert("impossible de contacter le serveur");
  });
}

