let results=[];
let currentIndexFaux = 0; // index dans la liste filtrée
let faussesQuestions = []; // <== déclaration globale
// Premier affichage

fetch("/api/get-results")
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert("Aucun résultat trouvé");
      return;
    }
  results = data.results;
  //contient juste les questions malrépondus
  faussesQuestions = results.filter(q => !q.isCorrect);

   // afficher la première question fausse
    if (faussesQuestions.length > 0) {
      afficherQuestionFausse(currentIndexFaux);
    } /*else {
      document.getElementById("question-container").innerHTML =
        "<p>Bravo ! Aucune erreur 🎉</p>";
    }*/

});

//adaptation du code pour questions avec et sans images 

function getResponseBoxes() {
  const imgZone = document.querySelector('.img-qcm');
  if (imgZone && imgZone.style.display === 'block') {
    return document.querySelectorAll('.eachresponse2');
  } else {
    return document.querySelectorAll('.eachresponse');
  }
}

// Fonction pour afficher une question fausse donnée
function afficherQuestionFausse(index) {
  if (index < 0 || index >= faussesQuestions.length) return;
  //la question courante
  const q = faussesQuestions[index];
  document.getElementById("texte-question").textContent=q.question;
  
  // réponses
  const boxes = getResponseBoxes();
  boxes.forEach((box, i) => {
    const label = box.querySelector('p');         // <p class="ajust0">
    if (q.reponses && q.reponses[i] !== undefined) {
      label.textContent = q.reponses[i];
      box.style.display = '';
      // reset état visuel
      box.classList.remove('active','hover', 'correct', 'missed', 'wrong');
      box.style.transform = 'scale(1)';
      //si le box est parmi les reponses de l'utilisateur on fait un zoom 
       if(q.userAnswer.includes(i)){
          box.style.transform = 'scale(1.02)';
          box.classList.add('active');

         //si est une réponse correcte 
          if(q.corrects.includes(i)){
            box.classList.remove('active');
            box.classList.add('correct');
         }else{
            box.classList.remove('active');
            box.classList.add('wrong');
         }
       }else if(q.corrects.includes(i)){
         box.classList.add('missed');
       }

    } else {
      box.style.display = 'none';
    }
  });

 if(index==0){
 document.getElementById("prev").style.display="none";
}else{
  document.getElementById("prev").style.display="block";
}
 if(index==faussesQuestions.length - 1){
 document.getElementById("next").style.display="none";
}else{
  document.getElementById("next").style.display="block";
}

  // (optionnel) image si disponible une image dan sla question 
 
  const imgZone = document.querySelector('.img-qcm'); 
  if(q.image && q.image !== "null"){
       document.getElementById('zoom').style.display='block';
      imgZone.style.display = 'block';
      imgZone.src = q.image;//affichage de l'image
       document.getElementById('barrcorrection').classList.replace('correction-container','correction-container2');
       
      //ajuster la question 
      document.getElementById('question').classList.remove('question');
      document.getElementById('question').classList.add('question2');
      //ajuster les reponses
        boxes.forEach((box) => { 
      box.classList.remove('eachresponse');
      box.classList.add('eachresponse2');
        });
       
    } else {
      document.getElementById('zoom').style.display='none';
      imgZone.style.display = 'none';
      //ajuster la question
      document.getElementById('question').classList.remove('question2');
      document.getElementById('question').classList.add('question');
     //ajuster les reponses
      boxes.forEach((box) => { 
      box.classList.remove('eachresponse2');
      box.classList.add('eachresponse');
       });
       document.getElementById('barrcorrection').classList.replace('correction-container2','correction-container');
      
    }
   
}

const container = document.getElementById("correction-container");

function showPage(direction, callback) {
  const oldPage = container.cloneNode(true);
  oldPage.style.position = "absolute";
  oldPage.style.top = container.offsetTop + "px";
  oldPage.style.left = container.offsetLeft + "px";
  oldPage.style.width = container.offsetWidth + "px";
  oldPage.style.height = container.offsetHeight + "px";
  document.body.appendChild(oldPage);

  // préparer la nouvelle entrée
  container.classList.add(direction === "left" ? "slide-left-enter" : "slide-right-enter");

  // reflow
  void container.offsetWidth;

  // lancer les anims
  oldPage.classList.add(direction === "left" ? "slide-left-exit-active" : "slide-right-exit-active");
  container.classList.add(direction === "left" ? "slide-left-enter-active" : "slide-right-enter-active");

  // quand l'anim finit
  setTimeout(() => {
    oldPage.remove();
    container.className = "questions"; // reset classes
    if (callback) callback();
  }, 400);
}





// Boutons suivant / précédent
document.getElementById("next").addEventListener("click", () => {
  if (currentIndexFaux < faussesQuestions.length - 1) {
    showPage("left",()=>{
        currentIndexFaux++;
    afficherQuestionFausse(currentIndexFaux);
    });    
  }
});

document.getElementById("prev").addEventListener("click", () => {
  if (currentIndexFaux > 0) {
    showPage("right",()=>{
     currentIndexFaux--;
    afficherQuestionFausse(currentIndexFaux);
    });    
  }
});

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
