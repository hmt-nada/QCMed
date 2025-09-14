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

// Fonction de validation
function validerFacultes() {
  const facs = Array.from(document.querySelectorAll("input:checked"))
                    .map(el => el.value)
                    .filter(val => val !== "on");



  const data ={
    faculte:facs
  };
  console.log("DATA ENVOYÉ :", data); 
//evoie une requête HTTP a cette address
fetch("/api/choixfaculte",{
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
        localStorage.setItem("selectedModule", moduleNom); 
        // Stocker localement pour récupérer ensuite dans cours.js
  localStorage.setItem("selectedFacultes", JSON.stringify(facs));  
        window.location.href = "cours.html";  
    }else{
      alert("erreur:"+result.message);
    }
   })
//gestion des erreurs du reseau (connection avec serveur )
.catch(error=>{
  console.error("erreur lors de l'envoi:",error);
  alert("impossible de contacter le serveur");
});
}

boutton.addEventListener('click',function(event){
let check=false;

checkboxes.forEach((box) => {

    if (box.checked) {
      check = true;
    }
  });


if(!check){
    event.preventDefault();

 // Pour chaque checkbox non cochée
    checkboxes.forEach((box) => {
      // On récupère le div qui a la classe .checkmark (c'est l'élément visuel du "coche")
      const mark = box.parentElement.querySelector('.checkmark');

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
   

}else {   
  
    validerFacultes()
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
        // Une fois prêt → cacher le loader et montrer la page
      document.getElementById("loader").style.display = "block";
      document.getElementById("content").style.display = "none";
        
      });
  });






