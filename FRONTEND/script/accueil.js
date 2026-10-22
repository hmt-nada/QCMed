// ─── Charger les modules depuis la BDD ────────────────────────────
function afficherModules() {
  const container = document.getElementById("modules-list");
  container.innerHTML = "";

  fetch('/api/modules')
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      if (data.modules.length === 0) {
        container.innerHTML = `
          <p style="color:#888; font-size:14px; text-align:center; padding:20px 0;">
            Aucun module disponible pour le moment.
          </p>
        `;
        return;
      }

      data.modules.forEach(m => {
        const card = document.createElement("div");
        card.className = "module-container";
        card.dataset.nom    = m.nom;
        card.dataset.module = m.id;

        card.innerHTML = `
          <div class="module-card" onclick="choisirmodule(${m.id}, '${m.nom}')">
            <div class="module-card-img">
              <img src="images/${m.img ?? 'default-module.svg'}" alt="${m.nom}" class="module-img"/>
            </div>
            <div class="module-card-body">
              <p class="name-style">${m.nom}</p>
              <div class="module-cours">( 0 cours )</div>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      // ✅ Appelé ICI — après que les cartes sont dans le DOM
      fetch("/api/cours-par-module")
        .then(res => res.json())
        .then(stats => {
          stats.forEach(item => {
            const el = document.querySelector(`[data-module="${item.id}"]`);
            if (!el) return;
            const coursDiv = el.querySelector(".module-cours");
            if (coursDiv) coursDiv.textContent = `( ${item.nombre_cours || 0} cours )`;
          });
        })
        .catch(err => console.error("Erreur stats :", err));

      // ✅ Activer la recherche après chargement
      activerRecherche();

    })
    .catch(err => console.error('Erreur modules :', err));
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

//afficher le pseudo et avatar 

  function onUtilisateurCharge(user) {
  document.getElementById("pseudo2").textContent = user.pseudo;

  // Affichage de la bannière si l'utilisateur est inscrit en 2ème année ou plus
  const fallbackBanner = document.getElementById("annee-fallback-banner");
  if (fallbackBanner && (user.isFallbackYear || (user.annee && String(user.annee) !== '1'))) {
    fallbackBanner.style.display = "flex";
  }

  afficherModules();
  const mobUsername = document.getElementById("mobUsername");
if (mobUsername) mobUsername.textContent = user.pseudo;
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

