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

//récupération du temps 
const temps = localStorage.getItem("selectedTime");

const introData = [
  { chiffre: "3", texte: "Prépare-toi..." },
  { chiffre: "2", texte: "Concentre-toi..." },
  { chiffre: "1", texte: "C'est parti !" }
];

const messageDiv = document.getElementById('message');
const chiffreDiv = document.getElementById('chiffre');
const texteDiv = document.getElementById('texte');
const intro = document.getElementById('intro-animation');
const compteur = document.getElementById('compteur');
const horloge = document.getElementById('horloge');
let intervale; // pour pouvoir le clear


//variables globales 

let questions = [];
let indexActuel = 0;
let questionsChargees = false;
let reponsesUtilisateur = []; 
let modeCorrection="";
let reponsesBloquees = false;
// tableau ou objet pour marquer les questions déjà affichées
let seenQuestions = {};

let modetime=false;
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
//récupération du tableau des records des QCMs

function chargerQuestions() {
  fetch("/api/questions")
    .then(r => r.json())
    .then(data => {
      if (!data.success) throw new Error(data.error || "Erreur API");

      //questions = data.questions;
    
      // enrichir chaque question avec les variables supplémentaires
      questions = data.questions.map(q => ({
        ...q,                   // garder les champs envoyés par le backend
        userAnswer: null,       // par défaut aucune réponse choisie
        isCorrect: false,       // par défaut considéré faux
        errorType: null ,        // facultatif : peut contenir une explication du type d’erreur
        correctionAffichee: false,
        score:0 
      }));
      questionsChargees = true;

     // Le mode de correction    
     modeCorrection = data.correction;
     
   })
    .catch(err => console.error(err));
}

function starttimer(){
  horloge.style.display = "none";
  compteur.style.display = "none";
  document.getElementById("btnvalider").style.display = "none";
  document.getElementById("expresscorr").style.display = "block";
  document.getElementById("repfigcorr").style.display = "none";
  document.getElementById('btncorr').addEventListener('click',()=>{
  document.getElementById("expresscorr").style.display = "none";
  document.getElementById("repfigcorr").style.display = "block";
  });
}

//fonction pour afficher une question avec ses reponses 
//id est l'indice de la question qu'on va afficher 
function afficherQuestion(id) {
  if (!questions.length) {
    console.error("Aucune question à afficher");
    return;
  }
  //q est un record qui contient tous ls infos de cette qustion 
const q = questions[id];

//afficher le text de la question 
document.getElementById('texte-question').textContent=q.question;
//afficher le titre du cours de cette question 
document.getElementById('texte-cours').textContent = getNomModule(q.cours);
//afficher numero de la question 
document.getElementById('numero-question').textContent = `QUESTION : ${id+1}/${questions.length}`;
// réponses
  const boxes = getResponseBoxes();
  boxes.forEach((box, i) => {
    const label = box.querySelector('p');         // <p class="ajust0">
    if (q.reponses && q.reponses[i] !== undefined) {
      label.textContent = q.reponses[i];
      box.style.display = '';
      // reset état visuel
      box.classList.remove('active','hover','correct','wrong','missed');
      box.style.transform = 'scale(1)';
    } else {
      box.style.display = 'none';
    }
  });
  // (optionnel) image si disponible une image dan sla question 
  const imgZone = document.querySelector('.img-qcm'); 
  if(q.image && q.image !== "null"){
       document.getElementById('zoom').style.display='block';
      imgZone.style.display = 'block';

      imgZone.src = q.image;//affichage de l'image 
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
      //ajuster la question
      document.getElementById('question').classList.replace('question2','question');
    boxes.forEach(b => b.classList.replace('eachresponse2','eachresponse'));
    document.getElementById('expresscorr').classList.replace('ordre12','ordre');
    document.getElementById('btnsuivant').classList.replace('buttsuivant2','buttsuivant');
    document.getElementById('btnenvoyer').classList.replace('buttsoumettre2','buttsoumettre');
    document.getElementById('btncorr').classList.replace('buttcorrection2','buttcorrection');
    document.getElementById('btnvalider').classList.replace('buttval2','buttval');
    document.getElementById('repfigcorr').classList.replace('ordre22','ordre2');
  }
  
//vérifier si c la derniere question a afficher on remplace le boutton (suivant ) par (envoyer)

if (indexActuel === questions.length - 1 ) {
    document.getElementById('btnsuivant').style.display = 'none';   // on cache Suivant
    document.getElementById('btnenvoyer').style.display = 'block';  // on montre Soumettre
} else {
    document.getElementById('btnsuivant').style.display = 'block';  // on montre Suivant
    document.getElementById('btnenvoyer').style.display = 'none';   // on cache Soumettre
}
//supprimer le boutton (précédent) dans la 1ére question 
if(indexActuel===0 ){
document.getElementById('btnprec').style.display="none";
}else{
document.getElementById('btnprec').style.display="block";
}


if (seenQuestions[indexActuel]){
if (indexActuel === questions.length - 1 ) {
    document.getElementById('btnsuivant').style.display = 'none';   // on cache Suivant
    document.getElementById('btnenvoyer').style.display = 'block';  // on montre Soumettre
} else {
    document.getElementById('btnsuivant').style.display = 'block';  // on montre Suivant
    document.getElementById('btnenvoyer').style.display = 'none';   // on cache Soumettre
}
//supprimer le boutton (précédent) dans la 1ére question 
if(indexActuel===0){
document.getElementById('btnprec').style.display="none";
}else{
document.getElementById('btnprec').style.display="block";
}
}

//si est une question precedente on affich le choix de l'utilisateur 
if (reponsesUtilisateur[id]) {
  reponsesUtilisateur[id].forEach(indice => {
    if (boxes[indice]) {
      boxes[indice].classList.add("active");
      boxes[indice].style.transform = "scale(1.02)";
    }
  });
}
//Si cette question avait déjà été corrigée, on relance la correction
  if (questions[id].correctionAffichee) {
    corrigerQuestion(id);
  }
  // gérer l’affichage des messages selon correctionAffichee
if (questions[id].correctionAffichee) {
  document.getElementById("expresscorr").style.display = "none";
  document.getElementById("repfigcorr").style.display = "block";
} else {
  document.getElementById("expresscorr").style.display = "block";
  document.getElementById("repfigcorr").style.display = "none";
}
}
//gérer la question precedente 
document.getElementById('btnprec').addEventListener('click',()=>{
if (indexActuel > 0) {
    indexActuel--;
    afficherQuestion(indexActuel);
  }
});
//gérer la qustion suivante 
document.getElementById('btnsuivant').addEventListener('click',()=>{
if(!repenvoye){
validerReponse(indexActuel);
repenvoye=true;
 document.getElementById("btnfaute").style.visibility = "visible";
}
 
if (indexActuel < questions.length - 1) {   
    indexActuel++;
    repenvoye=false;
    reponsesBloquees = false;
     
    
    // Vérifier si c'est la première fois qu'on affiche cette question
    if (!seenQuestions[indexActuel]) {
      seenQuestions[indexActuel] = true;
      clearInterval(intervale);
      starttimer();
      
    }
    afficherQuestion(indexActuel);    
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
          }
          
      else{
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
   // mettre à jour les messages
  document.getElementById("expresscorr").style.display = "none";
  document.getElementById("repfigcorr").style.display = "block";
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
        } else {
          const wait = setInterval(() => {
            if (questionsChargees) {
              clearInterval(wait);
              afficherQuestion(indexActuel);
            }
          }, 100);
        }
      }, 1000);
    }
  }, 1600);
}


let repenvoye=false;



//appel des fonctions 

window.lancerIntro = function () {
  chargerQuestions();
  showNext();
};

//le clic des reponses (cocher les choix )
//gérer durant le timer et après 

getResponseBoxes().forEach((reponse,i) => {
  
  reponse.addEventListener('click', () => {
 if((!reponsesBloquees && !questions[indexActuel].correctionAffichee) ){
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
    if(!questions[indexActuel].correctionAffichee){
      reponse.classList.add('hover'); // quand la souris entre
    }
    
  });

  reponse.addEventListener('mouseleave', () => {
    if( !questions[indexActuel].correctionAffichee ){
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
   const note= calculerNoteFinale(questions);

    const data ={
   note:note,
   questions:questions
  };
  console.log("DATA ENVOYÉ :", data); 
//evoie une requête HTTP a cette address
fetch("/api/submit-qcm",{
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
    //si succss est true(module rçu)
    if (result.success){   
       //ici il faut un redirection vars la page de la note 
       window.location.href = "noteqcm.html";
    }else{
      alert("erreur:"+result.message);
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
  btnFaute.onclick = () => modal.style.display = "block";

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
    fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          document.getElementById('alert_erreur').classList.remove("visible"); // pour reset
          void document.getElementById('alert_erreur').offsetWidth; // forcer le recalcul CSS
          document.getElementById('alert_erreur').classList.add("visible");

  // Cacher l'alerte après 3 secondes
  setTimeout(() => {
    document.getElementById('alert_erreur').classList.remove("visible");
      btnFaute.style.visibility = "hidden";;
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
