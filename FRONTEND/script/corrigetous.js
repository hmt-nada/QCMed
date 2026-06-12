let results = [];          // Contien les questions finales à afficher (filtrées ou non)
let currentIndex = 0;      // Index de la question en cours

// 1. Détection automatique du mode via l'URL (?mode=faux ou ?mode=tous)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') || 'tous'; // 'tous' par défaut si rien n'est écrit

// Premier affichage
fetch(`/api/get-results`)
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert("Aucun résultat trouvé");
      return;
    }
    
    const toutesQuestions = data.results;

    // FUSION DES LOGIQUES : Filtrage dynamique selon le mode détecté
    if (mode === "faux") {
      results = toutesQuestions.filter(q => !q.isCorrect);
      document.getElementById("titre-correction").textContent = "Correction des réponses ratées";
    } else {
      results = toutesQuestions;
      document.getElementById("titre-correction").textContent = "Correction détaillée – QCM complet";
    }

    // Affichage initial
    if (results.length > 0) {
      afficherQuestionCorrige(0);
    } else {
      document.getElementById("correction-container").innerHTML = 
        `<div style="text-align:center; padding: 20px;">
          <p style="font-size: 1.5rem; font-weight:600; color: #2e7d32;">Bravo ! Aucune erreur 🎉</p>
         </div>`;
    }
  });

// CORRECTION BUG : Sélection stable basée sur la hiérarchie HTML, peu importe la classe active
function getResponseBoxes() {
  return document.querySelectorAll('.responsebox > div');
}

// Fonction principale d'affichage
function afficherQuestionCorrige(index) {
  if (index < 0 || index >= results.length) return;
  
  currentIndex = index; // Sauvegarde l'index actuel globale
  const q = results[currentIndex];
  
  // Texte de la question
  document.getElementById("texte-question").textContent = q.question;

  // Gestion des réponses
  const boxes = getResponseBoxes();
  boxes.forEach((box, i) => {
    const label = box.querySelector('p');
    
    if (q.reponses && q.reponses[i] !== undefined) {
      label.textContent = q.reponses[i];
      box.style.display = 'flex';
      
      // Reset complet des états graphiques
      box.classList.remove('active', 'hover', 'correct', 'missed', 'wrong');
      box.style.transform = 'scale(1)';
      
      // Marquage des choix utilisateur et des bonnes réponses
      if (q.userAnswer && q.userAnswer.includes(i)) {
        box.style.transform = 'scale(1.02)';
        box.classList.add('active');

        if (q.corrects && q.corrects.includes(i)) {
          box.classList.remove('active');
          box.classList.add('correct');
        } else {
          box.classList.remove('active');
          box.classList.add('wrong');
        }
      } else if (q.corrects && q.corrects.includes(i)) {
        box.classList.add('missed');
      }

    } else {
      box.style.display = 'none';
    }
  });

  // Visibilité des boutons Précédent / Suivant
  document.getElementById("prev").style.display = currentIndex === 0 ? "none" : "block";
  document.getElementById("next").style.display = currentIndex === results.length - 1 ? "none" : "block";

  // Gestion des images et adaptation des structures responsives
  const imgZone = document.querySelector('.img-qcm'); 
  const zoomBtn = document.getElementById('zoom');
  const barCorrection = document.getElementById('barrcorrection');
  const questionDiv = document.getElementById('question');

  if (q.image && q.image !== "null" && q.image !== "") {
    if (zoomBtn) zoomBtn.style.display = 'block';
    if (imgZone) {
      imgZone.style.display = 'block';
      imgZone.src = q.image;
    }
    if (barCorrection) barCorrection.className = 'correction-container2';
    if (questionDiv) questionDiv.className = 'question2';
    
    boxes.forEach((box) => { 
      box.classList.remove('eachresponse');
      box.classList.add('eachresponse2');
    });
       
  } else {
    if (zoomBtn) zoomBtn.style.display = 'none';
    if (imgZone) imgZone.style.display = 'none';
    if (questionDiv) questionDiv.className = 'question';
    if (barCorrection) barCorrection.className = 'correction-container';
    
    boxes.forEach((box) => { 
      box.classList.remove('eachresponse2');
      box.classList.add('eachresponse');
    });
  }
}

// Gestion de l'animation de glissement (Slide)
const container = document.getElementById("correction-container");

function showPage(direction, callback) {
  // CORRECTION BUG ID: On clone mais on supprime temporairement les ID pour éviter les doublons durant l'anim
  const oldPage = container.cloneNode(true);
  oldPage.removeAttribute('id');
  oldPage.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

  oldPage.style.position = "absolute";
  oldPage.style.top = container.offsetTop + "px";
  oldPage.style.left = container.offsetLeft + "px";
  oldPage.style.width = container.offsetWidth + "px";
  oldPage.style.height = container.offsetHeight + "px";
  document.body.appendChild(oldPage);

  // Appliquer la transition d'entrée sur le conteneur actif
  container.className = "questions " + (direction === "left" ? "slide-left-enter" : "slide-right-enter");

  // Force le Reflow
  void container.offsetWidth;

  // Lancement de l'animation
  oldPage.classList.add(direction === "left" ? "slide-left-exit-active" : "slide-right-exit-active");
  container.classList.add(direction === "left" ? "slide-left-enter-active" : "slide-right-enter-active");

  // Nettoyage après l'animation
  setTimeout(() => {
    oldPage.remove();
    container.className = "questions"; 
    if (callback) callback();
  }, 400);
}

// Clics boutons de navigation
document.getElementById("next").addEventListener("click", () => {
  if (currentIndex < results.length - 1) { 
    showPage("left", () => {
      currentIndex++;
      afficherQuestionCorrige(currentIndex);
    });  
  }
});

document.getElementById("prev").addEventListener("click", () => {
  if (currentIndex > 0) {  
    showPage("right", () => {
      currentIndex--;
      afficherQuestionCorrige(currentIndex);
    }); 
  }
});

// GESTION OVERLAY ET ZOOM IMAGE
const imgQcm = document.getElementById('qcm-img');
const zoomBtn = document.getElementById('zoom');
const overlay = document.getElementById('img-overlay');
const zoomedImg = document.getElementById('zoomed-img');
const closeBtn = document.getElementById('zoom2');

if (imgQcm && zoomBtn) {
  [imgQcm, zoomBtn].forEach(el => {
    el.addEventListener('click', () => {
      if (imgQcm.src && imgQcm.style.display !== 'none') {
        zoomedImg.src = imgQcm.src;
        overlay.style.display = 'flex';
      }
    });
  });
}

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
}

if (overlay) {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
}