// Dictionnaire id → nom
const coursMap = {
  arteresdumembrepelvien: "Artères du Membre Pelvien",
  arteresdumembrethoracique: "Artères du Membre Thoracique",
  articulationdelacheville:"Articulation de la Cheville",
  articulationdelahanche:"Articulation de la Hanche",
  structuredesglucides:"Structure des Glucides"
}
// Fonction pour récupérer le nom d’un module à partir de son id
function getNomModule(coursId) {
  return coursMap[coursId.toLowerCase()] || coursId;
}

const params = new URLSearchParams(window.location.search);

const mode = params.get("mode") || "normal";

console.log("Mode QCM :", mode);

//récupération du temps 
const temps = localStorage.getItem("selectedTime");

const introData = mode==="retry"
?
[
 {chiffre:"3",texte:"Reprise du QCM"},
 {chiffre:"2",texte:"Questions ratées"},
 {chiffre:"1",texte:"Bonne chance"}
]

:
[
 {chiffre:"3",texte:"Prépare-toi"},
 {chiffre:"2",texte:"Concentre-toi"},
 {chiffre:"1",texte:"C'est parti"}
];

const messageDiv = document.getElementById('message');
const chiffreDiv = document.getElementById('chiffre');
const texteDiv = document.getElementById('texte');
const intro = document.getElementById('intro-animation');
const compteur = document.getElementById('compteur');
const horloge = document.getElementById('horloge');
let intervale; // pour pouvoir le clear
const reponses = getResponseBoxes();

//variables globales 
// --- en haut : parse la valeur du localStorage en nombre
const tempsBase = Number(localStorage.getItem("selectedTime")) || 0;

// helper : convertir "MM:SS" -> secondes
function parseDisplayToSeconds(text) {
  if (!text || text === "Temps écoulé") return 0;
  const parts = text.split(':').map(p => Number(p));
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
  return Number(parts[0]) || 0;
}

let questions = [];
let results=[];
let indexActuel = 0;



let questionsChargees = false;
let reponsesUtilisateur = []; 
let modeCorrection="";

// tableau ou objet pour marquer les questions déjà affichées
let seenQuestions = {};

// centralise l'affichage des boutons selon l'état de la question
function updateButtonsState(q, tempsRestant = null) {
  const btnPrec = document.getElementById('btnprec');
  const btnSuiv = document.getElementById('btnsuivant');
  const btnEnv  = document.getElementById('btnenvoyer');
  const btnVal  = document.getElementById('btnvalider');
  const btnCorr = document.getElementById('btncorr');
  const btnFaute = document.getElementById('btnfaute');
  const expressval = document.getElementById('expressval');
  const repfigcorr = document.getElementById('repfigcorr');
  const expresscorr = document.getElementById('expresscorr');

  const tempsEcoule = compteur.textContent === "Temps écoulé" ||
                      (typeof tempsRestant === 'number' && tempsRestant <= 0);

  const locked = q && (q.validerclick || q.correctionAffichee || tempsEcoule);

  if (locked) {
    // état "verrouillé" (après validation / temps écoulé / correction)
    btnVal.style.display = 'none';
    btnCorr.style.display = 'block';
    
    repfigcorr.style.display = 'block';
    expressval.style.display = 'none';
    expresscorr.style.display = 'none';

    btnPrec.style.display = indexActuel === 0 ? 'none' : 'block';
    if (indexActuel === questions.length - 1) {
      btnSuiv.style.display = 'none';
      btnEnv.style.display = 'block';
    } else {
      btnSuiv.style.display = 'block';
      btnEnv.style.display = 'none';
    }
if(q.signalement){
   btnFaute.style.visibility = "hidden";
  }else{
    btnFaute.style.visibility = "visible";
  }

  } else {
    // état "en cours" (timer actif, pas validée)
    btnVal.style.display = 'block';
    btnCorr.style.display = 'none'; 
    repfigcorr.style.display = 'none';
    expressval.style.display = 'block';
    expresscorr.style.display = 'none';
    btnFaute.style.visibility = "hidden";
    btnPrec.style.display = 'none';
    btnSuiv.style.display = 'none';
    btnEnv.style.display = 'none';
  }
  
}


//fonction pour adapter les fonctions sur .eachresponse ou .eachresponse2
function getResponseBoxes() {
  // si l'image est visible on prend les eachresponse2, sinon eachresponse
  const imgZone = document.querySelector('.img-qcm');
  if (imgZone && imgZone.style.display === 'block') {
    return document.querySelectorAll('.eachresponse2');
  } else {
    return document.querySelectorAll('.eachresponse');
  }
}
// prépare chaque question avec les champs nécessaires
function prepareQuestion(q){

  return {
    ...q,
    userAnswer:null,
    isCorrect:false,
    errorType:null,
    correctionAffichee:false,
    score:0,
    validerclick:false,
    tempsRestant:null,
    signalement:false
  };
}

function chargerQuestions() {
  if (mode === "retry") {
    fetch('/api/tentative-faux')
      .then(res => res.json())
      .then(data => {
        results     = data.results;
        questions   = data.results.filter(q => !q.isCorrect).map(prepareQuestion);
        modeCorrection = data.correction;
        questionsChargees = true;
      });
  } else {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          console.error('Erreur chargement questions :', data.message);
          return;
        }
        questions      = data.questions.map(prepareQuestion);
        modeCorrection = data.correction; // ← récupérer le mode de correction
        questionsChargees = true;
      })
      .catch(err => console.error('Erreur réseau :', err));
  }
}

// starttimer: démarre/relance le timer pour la question targetIndex (défaut = indexActuel)
function starttimer(targetIndex = indexActuel) {
  // sécurité
  if (isNaN(tempsBase) || tempsBase <= 0) return;
  const q = questions[targetIndex];
  if (!q) return;

  // si la question est déjà validée/corrigée/temps écoulé, on n'ouvre pas un nouveau timer
  if (q.validerclick || q.correctionAffichee || q.tempsRestant === 0) {
    // affiche la valeur sauvegardée (ou la valeur par défaut)
    const display = (q.tempsRestant != null) ? q.tempsRestant : tempsBase;
    mettreAJourCompteur(display);
    updateButtonsState(q, q.tempsRestant);
    return;
  }

  // stop l'ancien timer avant d'en créer un nouveau
  clearInterval(intervale);

  // initialise la valeur si première fois
  if (q.tempsRestant == null) q.tempsRestant = tempsBase;
  let tempsRestant = q.tempsRestant;

  horloge.style.display = "flex";
  compteur.style.display = "block";

  // afficher immédiatement
  mettreAJourCompteur(tempsRestant);

  // marquer comme "déjà vu / timer démarré"
  seenQuestions[targetIndex] = true;

  intervale = setInterval(() => {
    tempsRestant--;
    q.tempsRestant = tempsRestant;

    if (tempsRestant <= 0) {
      clearInterval(intervale);
      q.tempsRestant = 0;
      q.validerclick = true; // temps écoulé bloque la question
      mettreAJourCompteur(0); // affichera "Temps écoulé"
      // updateButtonsState se fera via mettreAJourCompteur
    } else {
      mettreAJourCompteur(tempsRestant);
    }
  }, 1000);
}


//fonction pour afficher une question avec ses reponses 
//id est l'indice de la question qu'on va afficher 
// afficherQuestion : n'écrit plus seenQuestions ici, et affiche la valeur sauvegardée (sans démarrer le timer)
function afficherQuestion(id) {
  if (!questions.length) {
    console.error("Aucune question à afficher");
    return;
  }
  const q = questions[id];

  document.getElementById('texte-question').textContent = q.question;
  document.getElementById('texte-cours').textContent = getNomModule(q.cours);
  document.getElementById('numero-question').textContent = `QUESTION : ${id+1}/${questions.length}`;

  const boxes = getResponseBoxes();
  boxes.forEach((box, i) => {
    const label = box.querySelector('p');
    if (q.reponses && q.reponses[i] !== undefined) {
      label.textContent = q.reponses[i];
      box.style.display = '';
      box.classList.remove('active','hover','correct','wrong','missed');
      box.style.transform = 'scale(1)';
    } else {
      box.style.display = 'none';
    }
  });

  // image / classes (ton code inchangé)
  const imgZone = document.querySelector('.img-qcm');
  if (q.image && q.image !== "null") {
    imgZone.style.display = 'block';
    document.getElementById('zoom').style.display='block';
    imgZone.src = q.image;
    document.getElementById('question').classList.replace('question','question2');
    boxes.forEach(b => b.classList.replace('eachresponse','eachresponse2'));
    document.getElementById('btnsuivant').classList.replace('buttsuivant','buttsuivant2');
    document.getElementById('expresscorr').classList.replace('ordre','ordre12');
    document.getElementById('btnenvoyer').classList.replace('buttsoumettre','buttsoumettre2');
    document.getElementById('btncorr').classList.replace('buttcorrection','buttcorrection2');
    document.getElementById('btnvalider').classList.replace('buttval','buttval2');
    document.getElementById('repfigcorr').classList.replace('ordre2','ordre22');
    
  } else {
    document.getElementById('zoom').style.display='none';
    imgZone.style.display = 'none';
    document.getElementById('question').classList.replace('question2','question');
    boxes.forEach(b => b.classList.replace('eachresponse2','eachresponse'));
    document.getElementById('expresscorr').classList.replace('ordre12','ordre');
    document.getElementById('btnsuivant').classList.replace('buttsuivant2','buttsuivant');
    document.getElementById('btnenvoyer').classList.replace('buttsoumettre2','buttsoumettre');
    document.getElementById('btncorr').classList.replace('buttcorrection2','buttcorrection');
    document.getElementById('btnvalider').classList.replace('buttval2','buttval');
    document.getElementById('repfigcorr').classList.replace('ordre22','ordre2');
  }

  // afficher le temps sauvegardé (ou la valeur par défaut) sans démarrer le timer
  const displayTime = (q.tempsRestant != null) ? q.tempsRestant : tempsBase;
  mettreAJourCompteur(displayTime);

  // afficher réponses utilisateur si existant
  if (reponsesUtilisateur[id]) {
    reponsesUtilisateur[id].forEach(indice => {
      if (boxes[indice]) {
        boxes[indice].classList.add("active");
        boxes[indice].style.transform = "scale(1.02)";
      }
    });
  }

  // relancer la correction visuelle si besoin
  if (questions[id].correctionAffichee) {
    corrigerQuestion(id);
  }
  // Gérer l'affichage des boutons (au cas où)
  updateButtonsState(q, q.tempsRestant);
  // Sync état favori pour cette question
syncFavoriBtn(q.id);

}

// bouton Suivant : clearInterval, changer index, afficher et lancer le timer pour la nouvelle question
document.getElementById('btnsuivant').addEventListener('click', () => {
  if (!repenvoye) {
    validerReponse(indexActuel);
    repenvoye = true;
    
    document.getElementById("btnfaute").style.visibility = "visible";
  }

  if (indexActuel < questions.length - 1) {
    clearInterval(intervale);            // stop l'ancien timer
    indexActuel++;
    repenvoye = false;
    // n'écrase pas validerclick ici (c'est par-question)
    afficherQuestion(indexActuel);
    starttimer(indexActuel);             // démarre ou reprend pour la question courante
  }
});

// bouton Précédent : idem
document.getElementById('btnprec').addEventListener('click', () => {
  if (indexActuel > 0) {
    clearInterval(intervale);
    indexActuel--;
    afficherQuestion(indexActuel);
    starttimer(indexActuel);
  }
});


function corrigerQuestion(id) {
  const q = questions[id];
  const userChoices = (reponsesUtilisateur[id] || []).map(Number);
  const corrects = (q.corrects || []).map(Number);  
  const boxes = getResponseBoxes();

  boxes.forEach((box, i) => {
    box.classList.remove("correct", "wrong", "missed", "active");
 
    if (userChoices.includes(i)) {
    //les choix de l'utilisateur
      if(q.corrects.includes(i)){
        //correctes
          
          box.classList.add("correct");
      }else{
        //fausses
         
         box.classList.add("wrong");
      }
    }
    if (!userChoices.includes(i) && q.corrects.includes(i)) {
      //correcte non-choisis
      
      box.classList.add("missed");
    }
  });
}

 document.getElementById('btncorr').addEventListener('click',()=>{
   
   corrigerQuestion(indexActuel) ;
   questions[indexActuel].correctionAffichee = true; //on marque cette question comme corrigée
   
 });

let i = 0;

function showNext() {
  
  const bloc = introData[i];
  chiffreDiv.textContent = bloc.chiffre;
  texteDiv.textContent = bloc.texte;
  messageDiv.classList.add('show');

  setTimeout(() => {
    messageDiv.classList.remove('show');
    i++;
    if (i < introData.length) {
      setTimeout(showNext, 700); // délai entre blocs
    } else {
      setTimeout(() => {
        intro.style.display = 'none';
        starttimer();

       // ) afficher la première question dès que possible
        if (questionsChargees) {
  afficherQuestion(indexActuel);
  starttimer(indexActuel);
} else {
  const wait = setInterval(() => {
    if (questionsChargees) {
      clearInterval(wait);
      afficherQuestion(indexActuel);
      starttimer(indexActuel);
    }
  }, 100);
} 
      }, 1000);
    }
  }, 1600);
}


let repenvoye=false;
//with timer 
document.getElementById("btnvalider").addEventListener('click',()=>{
  // bouton Valider : sauvegarde le temps affiché, stoppe le timer et passe la question en 'validerclick'

  const q = questions[indexActuel];
  // récupère le temps actuellement affiché et le stocke
  q.tempsRestant = parseDisplayToSeconds(compteur.textContent);
  q.validerclick = true;
  validerReponse(indexActuel);
  clearInterval(intervale);
  updateButtonsState(q, q.tempsRestant);
  repenvoye = true;
});

// mise à jour de l'affichage du compteur (reste équivalente mais on appelle updateButtonsState)
function mettreAJourCompteur(tempsRestant) {
  let minutes = Math.floor(tempsRestant / 60);
  let secondes = tempsRestant % 60;
  compteur.textContent =
    `${minutes.toString().padStart(2, '0')}:${secondes.toString().padStart(2, '0')}`;

  if (tempsRestant <= 0) {
    clearInterval(intervale);
    compteur.textContent = "Temps écoulé";
    // verrouillage de la question déjà fait dans starttimer, mais on s'assure :
    if (questions[indexActuel]) questions[indexActuel].validerclick = true;
    if (questions[indexActuel]) questions[indexActuel].tempsRestant = 0;
  } else if (questions[indexActuel] && questions[indexActuel].validerclick) {
    // si l'utilisateur a validé, on arrête ici (et on garde le temps affiché)
    clearInterval(intervale);
  }
  // met à jour l'état des boutons visible/masqué
  updateButtonsState(questions[indexActuel], tempsRestant);
}


//appel des fonctions 

window.lancerIntro = function () {
  chargerQuestions();
  showNext();
};

//le clic des reponses (cocher les choix )
//gérer durant le timer et après 

getResponseBoxes().forEach((reponse,i) => {
  
  reponse.addEventListener('click', () => {
 if((compteur.textContent != "Temps écoulé"  && !questions[indexActuel].validerclick && !questions[indexActuel].correctionAffichee) ){
    // Étape 1 : effet de clic rapide (pression visuelle)
   reponse.style.transform = "scale(0.96)";
   // mettre à jour la liste des réponses utilisateur
       if (!reponsesUtilisateur[indexActuel]) {
        reponsesUtilisateur[indexActuel] = [];
      }
    setTimeout(() => {
      // Étape 2 : toggle classe active
      reponse.classList.toggle('active');

      // Étape 3 : appliquer taille selon état actif
      if (reponse.classList.contains('active')) {
        reponse.style.transform = "scale(1.02)";
        // ajouter l'indice de la réponse choisie
        //vérifier qua ça existe pas pour eviter uplicate en casde plusieurs clics 
        if (!reponsesUtilisateur[indexActuel].includes(i)) {
           reponsesUtilisateur[indexActuel].push(i);
        }
      }else{
        reponse.style.transform = "scale(1)";
         // retirer l’indice si décoché
        reponsesUtilisateur[indexActuel] = reponsesUtilisateur[indexActuel].filter(ind => ind !== i);
      }
    }, 100); // délai pour simuler "pression"     
  }
}); 
   //autoriser le hover 
  reponse.addEventListener('mouseenter', () => {
    if(compteur.textContent != "Temps écoulé" && !questions[indexActuel].correctionAffichee){
      reponse.classList.add('hover'); // quand la souris entre
    }
    if(questions[indexActuel].validerclick){
       reponse.classList.remove('hover');
    }
  });

  reponse.addEventListener('mouseleave', () => {
    if(compteur.textContent != "Temps écoulé" && !questions[indexActuel].correctionAffichee ){
      reponse.classList.remove('hover'); // quand la souris sort
    }
  });
});

//fonction pour la correction (tout ou rien )
function scoreToutOuRien(corrects, userChoices) {
  //les réponses correctes 
  const C = new Set(corrects);
  //les réponses de l'utilisateur 
  const U = new Set(userChoices);
  //si il a répondu en lus ou n moins des réponses 
  if (C.size !== U.size) return 0;
  //on vérifie si les réponses sont justes
  for (const val of U) {
    if (!C.has(val)) return 0;
  }
  //si tout est correct 
  return 1;
}
//fonction pour la correction (partiel)
function scorePartiel(corrects, userChoices) {
  //les réponses corrects
  const C = new Set(corrects);
  //les réponses de l'utilisateur 
  const U = new Set(userChoices);
  if(U.size>C.size){
    return 0;
  }
  //on calcule la note selon les bonnes réponses trouvées 
  let bonnesTrouvees = 0;
  for (const val of U) {
    if (C.has(val)) bonnesTrouvees++;
  }
  //on calcule la note finale 
  return bonnesTrouvees / C.size;
} 
//fonction générale pour calculer l note finale sur 20 

function calculerNoteFinale(questions) {
  const totalPoints = questions.reduce((s, q) => s + (q.score || 0), 0);
    // Ramener la note sur 20
  const noteSur20 = (totalPoints / questions.length) * 20;
   // Supprime les zéros inutiles
  return Number(noteSur20.toFixed(2));// garder 2 chiffres après la virgule
}
//envoyer les reponses de l'utilisateur et isfalse a le tableau qui contient les questions 

function validerReponse(indexQuestion) {
  const q = questions[indexQuestion];
  const choixUtilisateur = reponsesUtilisateur[indexQuestion] || [];
 //stocker les réponses de l'utilisateur 
  q.userAnswer = choixUtilisateur;

  // Vérif exactitude (simple : égalité ensembles)
  const setUser = new Set(choixUtilisateur);
  const setCorrect = new Set(q.corrects);
  //comparaison entre les réponses de utilisateur et les réponses correctes 

  const isSame =
    setUser.size === setCorrect.size &&
    [...setUser].every(val => setCorrect.has(val));
  //true or false 
  q.isCorrect = isSame;

  // préciser l'erreur 
  //des remarques sur le type d'erreur 
  if (!isSame) {
    
    if (choixUtilisateur.length < q.corrects.length) q.errorType = "incomplet";
    else if (choixUtilisateur.length > q.corrects.length) q.errorType = "trop de réponses";
    else q.errorType = "mauvais choix";
  } else {
    q.errorType = null;
  }
  
  //calculer la note par question et la stocker avec la question 

  let questionScore = 0;
  if (modeCorrection === "ToutOuRien") {
    questionScore = scoreToutOuRien(q.corrects, choixUtilisateur);
  } else if (modeCorrection === "partiel") {
    questionScore = scorePartiel(q.corrects, choixUtilisateur);
  }else{
    //calculer la note sans affichage pour mettre des remarques 
    //l mode est toutourien
    questionScore = scoreToutOuRien(q.corrects, choixUtilisateur);
  }
  q.score = questionScore;    
}

document.getElementById('quitterlien').addEventListener('click',(e)=>{
const popup2=document.getElementById("popup-quitter");
const confirmer = document.getElementById("confirmerSoumission2");
const annuler = document.getElementById("annulerSoumission2");

     //aaficher l popup
     e.preventDefault();
    popup2.style.display = "flex"; // on montre la plaque
    // Si l’utilisateur confirme
   confirmer.addEventListener("click", () => {
    window.location="accueil.html";
});  
  // Si l’utilisateur annule
   annuler.addEventListener("click", () => {
    popup2.style.display = "none"; // juste fermer la popup

});
});

document.getElementById('btnenvoyer').addEventListener('click',(e)=>{
const btnSoumettre = document.getElementById("btnSoumettre");
const popup = document.getElementById("popup-confirmation");

const confirmer = document.getElementById("confirmerSoumission");
const annuler = document.getElementById("annulerSoumission");

    validerReponse(indexActuel);
     repenvoye=true;
     //aaficher l popup
     e.preventDefault();
    popup.style.display = "flex"; // on montre la plaque
    // Si l’utilisateur confirme
   confirmer.addEventListener("click", () => {
    popup.style.display = "none";
    //calculer la note finale 
   if(mode === "retry"){
  questions.forEach(q => {
    const idx = results.findIndex(r => r.question === q.question);
    if(idx !== -1) results[idx] = q;
  });
}

const sourceFinale = mode === "retry" ? results : questions;
const note = calculerNoteFinale(sourceFinale);
const data = { note, questions: sourceFinale };

  console.log("DATA ENVOYÉ :", data); 
//evoie une requête HTTP a cette address
fetch(`/api/submit-qcm`,{
  //préciser la méthode de l'envoie:post(pour l'accepter en backend on a fait post)
  method:"post",

  //on indique que les données sont en format json
  headers:{
    "content-type":"application/json"
  },
  //convertit l'objet data en format json pour que le backend le comprend 
  body:JSON.stringify(data),
  })
  //quand le serveur répond on transfère la réponse en objet js depuis json
   .then(response=>response.json())
   //result une variable qui contient la réponse du serveur 
   .then(result =>{
    if (result.success){   
       window.location.href = "note.html";
    } else {
      alert(result.message || result.warning || "Erreur lors de l'enregistrement du QCM.");
    }
   })

//gestion des erreurs du reseau (connection avec serveur )
.catch(error=>{
  console.error("erreur lors de l'envoi:",error);
  alert("impossible de contacter le serveur");
});
});
  // Si l’utilisateur annule
   annuler.addEventListener("click", () => {
    popup.style.display = "none"; // juste fermer la popup
});
});

const btnFaute = document.getElementById("btnfaute");
  const modal = document.getElementById("reportModal");
  const closeModal = document.getElementById("closeModal");
  const sendReportBtn = document.getElementById("sendReportBtn");
  const errorTypes = document.querySelector(".error-types");
  const checkboxes = errorTypes.querySelectorAll("input[type='checkbox']");
  const extraMsg = document.getElementById("extraMsg");

  // Ouvrir le modal
  btnFaute.onclick = () => {
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
};
      
  // Fermer le modal (croix)
  closeModal.onclick = () => closeReportModal();

  // Fermer le modal si on clique en dehors
  window.onclick = (event) => {
    if (event.target === modal) {
      closeReportModal();
    }
  };
// Helper : types sélectionnés
function getSelectedTypes() {
  return Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
}
  // Vérification au clic sur Envoyer
  sendReportBtn.addEventListener("click", () => {
    const types = getSelectedTypes();
    const checked = Array.from(checkboxes).some(cb => cb.checked);
    if (!checked) {
      errorTypes.classList.add("highlight-error");

      // Retirer l'effet rouge après 1s
      setTimeout(() => {
        errorTypes.classList.remove("highlight-error");
      }, 1000);

      return; // on bloque l’envoi
    }
    const commentaire = extraMsg.value; // on capture avant de vider
    closeReportModal();
    const data ={
        question:questions[indexActuel].question, 
        reponses:Array.isArray(questions[indexActuel].reponses) ? questions[indexActuel].reponses : [],
        reponsesCorrectes: questions[indexActuel].corrects || [],
        typeErreur:types, 
        commentaire:commentaire
    };
    fetch(`/api/report-error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Marquer la question comme signalée SEULEMENT ICI
        questions[indexActuel].signalement = true;

        // Mettre à jour les boutons
        updateButtonsState(questions[indexActuel]);

          document.getElementById('alert_erreur').classList.remove("visible"); // pour reset
          void document.getElementById('alert_erreur').offsetWidth; // forcer le recalcul CSS
          document.getElementById('alert_erreur').classList.add("visible");

  // Cacher l'alerte après 3 secondes
  setTimeout(() => {
    document.getElementById('alert_erreur').classList.remove("visible");
      
  }, 2000);
         
          
        } else {
          alert("Erreur: " + data.message);
        }
      });
  });

  // Fonction pour fermer et réinitialiser
  function closeReportModal() {
    modal.style.display = "none";
    checkboxes.forEach(cb => cb.checked = false); // décocher toutes
    extraMsg.value = ""; // vider message
  }
   
const imgQcm = document.getElementById('qcm-img');
const zoomBtn = document.getElementById('zoom');
const overlay = document.getElementById('img-overlay');
const zoomedImg = document.getElementById('zoomed-img');
const closeBtn = document.getElementById('zoom2');

// Ouvrir (clic image ou bouton zoom)
[imgQcm, zoomBtn].forEach(el => {
  el.addEventListener('click', () => {
    zoomedImg.src = imgQcm.src;
    overlay.style.display = 'flex';
  });
});

// Fermer (clic bouton fermer ou clic dehors)
closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
});

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.style.display = 'none';
});

// ─── Favori ───────────────────────────────────────────────────────
const btnFavori = document.getElementById('btnfavori');

function updateFavoriBtn(estFavori) {
  const btn = btnFavori.querySelector('.btn-favori');
  if (estFavori) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
}

// Appelé à chaque changement de question
function syncFavoriBtn(questionId) {
  fetch(`/api/favoris`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;
      const estFavori = data.favoris.some(f => f.id === questionId);
      updateFavoriBtn(estFavori);
    })
    .catch(() => {});
}

btnFavori.addEventListener('click', () => {
  const q = questions[indexActuel];
  if (!q) return;

  const btn      = btnFavori.querySelector('.btn-favori');
  const estActif = btn.classList.contains('active');

  if (estActif) {
    // Retirer des favoris
    fetch('/api/favoris/supprimer', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question_id: q.id })
    })
    .then(res => res.json())
    .then(data => { if (data.success) updateFavoriBtn(false); })
    .catch(() => {});
  } else {
    // Ajouter aux favoris
    fetch('/api/favoris/ajouter', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question_id: q.id })
    })
    .then(res => res.json())
    .then(data => { if (data.success) updateFavoriBtn(true); })
    .catch(() => {});
  }
});