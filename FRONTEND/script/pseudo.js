const rempli=document.getElementsByClassName('nonvide');

//si ils sont non vides (valide)
//nom prenom faculte année 
let pseudo=false;
for (let i = 0; i < rempli.length; i++) {
 rempli[i].addEventListener('input', function() {
    
        if (this.value.length > 0) {
            this.classList.add('valide');
            pseudo=true;
        } else {
            this.classList.remove('valide');
        }
    });
    rempli[i].addEventListener('blur', function() {
    
        if (this.value.length > 0) {
            this.classList.add('valide');
            pseudo=true;
        } else {
            this.classList.remove('valide');
        }
    });
}
const button = document.querySelector('.c-button--gooey');
  button.addEventListener('click', () => {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  });


const titre= document.getElementById('inscrivez');

  window.addEventListener('load', function() {
   titre.classList.add('slide-in');
  });

const plus=document.getElementById("plus");
const palette=document.getElementById('palette');

if(plus && palette){
plus.addEventListener("click",()=>{
palette.style.display="block";


})};

const avatars =document.querySelectorAll(".pdp");
const neutre="images/user.svg";

avatars.forEach(avatar =>{
avatar.addEventListener('click',()=>{
    const avtrchoisi=avatar.getAttribute("src");
    const user=document.getElementById('user');
    const currentavtr=user.getAttribute("src");

    if(currentavtr!=avtrchoisi){
    user.setAttribute("src",avtrchoisi);
    user.classList.add('profil');
    const plus=document.getElementById("plus");
    plus.classList.add('plusposition');
    
    avatars.forEach(a => a.classList.remove("selected-avatar"));
     avatar.classList.add('selected-avatar');
    }else{
    user.setAttribute("src",neutre);        
    avatar.classList.remove('selected-avatar');
    plus.classList.remove('plusposition');
    }
});
});
document.addEventListener("click", function (event) {
  const palette = document.getElementById("palette");
  const plus = document.getElementById("plus");

  // Si la palette est visible
  if (palette.style.display === "block") {
    // Si le clic ne se fait PAS sur la palette ni sur le bouton "+"
    if (!palette.contains(event.target) && event.target !== plus) {
      palette.style.display = "none"; // On cache la palette
    }
  }
});

let erreur=false;
const boutton=document.getElementById('boutton');
const nom=document.getElementById('nom');
const alert=document.getElementById('alert');


boutton.addEventListener('click',function(event){
  const email = sessionStorage.getItem("emailInscrit");
if(!pseudo){
        erreur=true;
        nom.style.borderColor="red";

}
nom.addEventListener('input',()=>{
if(erreur){
nom.style.borderColor = "";
nom.classList.remove('valide');
nom.addEventListener('blur',()=>{
if(nom.value.length>0){
nom.classList.add('valide');
erreur=false;
}
});
}
}); 
if (erreur) {
    event.preventDefault();
    // Supprimer d’abord pour éviter les doublons
    alert.classList.remove("visible"); // Réinitialise l'état
    void alert.offsetWidth; // Force le navigateur à re-calculer l'animation
     alert.classList.add("visible"); // Relance l'animation

// Disparaît au bout de 4 secondes
setTimeout(() => {
  alert.classList.remove("visible");
}, 2000);

}else {
     const user=document.getElementById('user');
     const currentavtr=user.getAttribute("src");
    

  const data ={
    pseudo:nom.value.trim(),
    avatar:currentavtr,
    email:email
  };
  console.log("DATA ENVOYÉ :", data); 
//evoie une requête HTTP a cette address
fetch(`/api/pseudo`,{
  //préciser la méthode de l'envoie:post(pour l'accepter en backend on a fait post)
  method:"post",
  //on indique que les données sont en format json
  headers: { "content-type": "application/json" },
  credentials: "include",  // ✅ important pour la session
  body: JSON.stringify(data),
  
})
  //quand le serveur répond on transfère la réponse en objet js depuis json
   .then(response=>response.json())
   //result une variable qui contient la réponse du serveur 
   .then(result =>{
    //si succss est true(inscription reussie)
    if (result.success){   
      sessionStorage.removeItem("emailInscrit");
      window.location.href = "accueil.html";
    }else{
      sessionStorage.removeItem("emailInscrit");
      alert("erreur:"+result.message);
    }
   })
//gestion des erreurs du reseau (connection avec serveur )
.catch(error=>{
  console.error("erreur lors de l'envoi:",error);
  alert("impossible de contacter le serveur");
});

  } 
});

