
const espacemodule=document.getElementById('nommodule');
const moduleId = localStorage.getItem("selectedModule");
if (moduleId) {  
espacemodule.textContent=moduleId;
}

//-----------------------

const titre= document.getElementById('inscrivez');

  

  const button = document.querySelector('.c-button--gooey');
  button.addEventListener('click', () => {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  });

const rempli=document.getElementsByClassName('nonvide');

//si ils sont non vides (valide)
//nom prenom faculte année 
for (let i = 0; i < rempli.length; i++) {
 rempli[i].addEventListener('input', function() {
        if (this.value.length > 0) {
            this.classList.add('valide');
        } else {
            this.classList.remove('valide');
        }
    });
}

  const selectnumber = document.getElementById("number");
  const champAutre = document.getElementById("autrenumber");
  const fleche=document.getElementById("fleche");

  selectnumber.addEventListener("change", () => {
    if (selectnumber.value === "autre") {
       champAutre.style.display = "block";
       selectnumber.style.display = "none";     // afficher si "autre"
       champAutre.focus();         
       champAutre.required = true;
       fleche.style.display = "none";  
       
    } else {
      
      champAutre.required = false;
     
    }   
});

const switche = document.getElementById('tempsToggle');
const horloge = document.getElementById('time');
let timeswitch=false;
let corrswitch=false;

// Exemple : vérifier s’il est activé
if (switche.checked) {
horloge.style.display="block"; 
timeswitch=true;
} else {
  
horloge.style.display="none";
timeswitch=false;

}
switche.addEventListener('change', () => {
  if (switche.checked) {
    horloge.style.display = "block";
timeswitch=true;
  } else {
    horloge.style.display = "none";
timeswitch=false;
  }
});

window.addEventListener("DOMContentLoaded", function () {
    document.getElementById("minutes").value = 1;
    document.getElementById("seconds").value = 30;
});

const switche2= document.getElementById('correction');
const choix = document.getElementById('choixcorr');

if (switche2.checked) {
choix.style.display="block"; 
corrswitch=true;
} else { 
choix.style.display="none";
corrswitch=false;

}
switche2.addEventListener('change', () => {
  if (switche2.checked) {
    choix.style.display = "block";
   corrswitch=true;
  } else {
    choix.style.display = "none";
    corrswitch=false;
  }
});
const autre=document.getElementById('autrenumber');
const checkboxes = document.querySelectorAll('.checkb');
checkboxes.forEach((box) => {
  box.addEventListener('change', function () {
    if (this.checked) {
      checkboxes.forEach((other) => {
        if (other !== this) other.checked = false;
      });
    }
  });
});
//fonction pour passer les infos en url 
function validercaract(){
  let nombre;
  let correction ;
  let times;
//recuperation du nombre de questions 
  if (selectnumber.value === "autre") {
    nombre=autre.value.trim();   
  } else if (selectnumber.value === "toutes") {
  nombre = "toutes";
 // on utilise ce mot-clé pour dire : toutes les questions
  }else{
    nombre=selectnumber.value.trim();
  }
//recuperation du mode de correction 
 if (switche2.checked){
  correction = document.querySelector('input[name="correctionMode"]:checked')?.value ;
 }else{
  //y'a pas d correction 
  correction=null;
 }
//récupération du temps limité a chaque question 
 if (switche.checked){
const minut= parseInt(document.getElementById("minutes").value,10);
const secondes=parseInt(document.getElementById("seconds").value,10);
    times= minut * 60 + secondes ;
    localStorage.setItem("mode", "avecTemps");
}else{
   times=null ;
   localStorage.setItem("mode", "sansTemps");
}
 const data ={
   nombre:nombre,
   correction:correction
  };
  console.log("DATA ENVOYÉ :", data); 
//evoie une requête HTTP a cette address
fetch("/api/choixcaract",{
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
       localStorage.setItem("selectedTime", times);        
       window.location.href ="qcm.html"; 
    }else{
      alert("erreur:"+result.message);
    }
   })

//gestion des erreurs du reseau (connection avec serveur)
.catch(error=>{
  console.error("erreur lors de l'envoi:",error);
  alert("impossible de contacter le serveur");
});
}

button.addEventListener(('click'),function(event){
let valid=true;
let check=false;

const min=document.getElementById("minutes");
const second=document.getElementById("seconds");

  if (selectnumber.value === "" || Number(selectnumber.value) === 0 ) {
    selectnumber.style.borderColor = "red";
    valid = false;
  }

  if (selectnumber.value === "autre" && autre.value.trim() === "") {
    autre.style.borderColor = "red";
    valid = false;
  }
//si la correction est activé

    if (switche2.checked){
checkboxes.forEach((box) => {
    if (box.checked) {
      check = true;
    }
  });
   if(!check){
    valid = false;
    checkboxes.forEach((box) => {
      // On récupère le div qui a la classe .checkmark (c'est l'élément visuel du "coche")
      const mark = box.parentElement.querySelector('.checkmark2');

      if (mark) {
        // On ajoute une classe CSS qui déclenche une animation (shake)
        mark.classList.add('shake');

        // On change temporairement la couleur du checkmark en rouge
        mark.style.setProperty('--clr', 'red');

        // Après 500ms (durée de l'effet), on réinitialise :
        setTimeout(() => {
          mark.classList.remove('shake');             // On retire l'effet de vibration
          mark.style.setProperty('--clr', '#161D6F'); // On remet la couleur d'origine (à adapter à ta couleur de base)
        }, 500);
      }
    });
}
 }
 if (switche.checked){
if ((isNaN(min.value)) || (isNaN(second.value))){
 valid = false;
 min.style.borderColor = "red";
 second.style.borderColor = "red";
}
 }

  selectnumber.addEventListener('change', () => {
  selectnumber.style.borderColor = "";
});
   autre.addEventListener('input', () => {
  autre.style.borderColor = "";
});
second.addEventListener('input', () => {
  second.style.borderColor = "";
});
min.addEventListener('input', () => {
  min.style.borderColor = "";
});

if(!valid){
  event.preventDefault();
}
else{
  validercaract();   
}
});

//afficher le pseudo et avatar 
window.addEventListener("DOMContentLoaded", () => {

    fetch(`/api/utilisateur`)
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          const user = result.utilisateur;
          document.getElementById("avatar").src = user.avatar;
          document.getElementById("pseudo").textContent = user.pseudo;
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
        console.error("Erreur récupération utilisateur :", err);
        document.getElementById("pseudo").textContent = "Erreur";
        
      });
  });
