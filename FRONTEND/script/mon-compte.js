const rempli=document.getElementsByClassName('nonvide');
let champnom=false;
let champrenom=false;
let champseudo=false;
let champfac=false;
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
const inputs = document.querySelectorAll('.code-input');

inputs.forEach((input, index) => {

  input.addEventListener('keydown', (e) => {
   if (e.key === 'Enter') {
      e.preventDefault();

      if (input.value.length > 0) {
        if (index < inputs.length - 1) {
          // Aller au champ suivant
          inputs[index + 1].focus();
        } else {
          // Dernier champ : désélectionner (comme cliquer dehors)
          input.blur();
        }
      }
    }
  });

 
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

//afficher le pseudo et avatar 
window.addEventListener("DOMContentLoaded", () => {

    fetch("/api/utilisateur", {
  method: "GET",
  credentials: "include" // 👈 envoie le cookie de session
})
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          const user = result.utilisateur;
          document.getElementById("avatar").src = user.avatar;
          
          document.getElementById("pseudo").textContent = user.pseudo;
         
        } else {
          document.getElementById("pseudo").textContent = "Inconnu";
                 
        }
      })
      .catch(err => {
        console.error("Erreur récupération utilisateur :", err);
        document.getElementById("pseudo").textContent = "Erreur";
        
      });
  });
  
  //initialisation ds champs 

window.addEventListener("DOMContentLoaded", () => {
   if (sessionStorage.getItem("profilchange") === "true") {

 document.getElementById('alert_erreur').classList.remove("visible"); // pour reset
void document.getElementById('alert_erreur').offsetWidth; // forcer le recalcul CSS
       document.getElementById('alert_erreur').classList.add("visible");

  // Cacher l'alerte après 3 secondes
  setTimeout(() => {
    document.getElementById('alert_erreur').classList.remove("visible");
  }, 2000);

   sessionStorage.removeItem("profilchange");
  }

    fetch(`/api/mon-compte`)
      .then(response => response.json())
      .then(result => {
        console.log("Données utilisateur reçues :", result.utilisateur);
        if (result.success) {
          const user = result.utilisateur;
          document.getElementById("user").src = user.avatar;
          document.getElementById("nom").value = user.nom;
          document.getElementById("prenom").value = user.prenom;
          document.getElementById("faculte").value = user.faculte;
          document.getElementById("pseudo2").value = user.pseudo;

const rempli=document.getElementsByClassName('nonvide');

//si ils sont non vides (valide)
//nom prenom faculte année 
for (let i = 0; i < rempli.length; i++) {       
            rempli[i].classList.add('valide');   
}
         
        } else {
          
          document.getElementById("nom").value = "Inconnu";
          document.getElementById("prenom").value = "Inconnu";
          document.getElementById("faculte").value = "Inconnu";
          document.getElementById("pseudo2").value= "Inconnu";
          
        }
      })
      .catch(err => {
          console.error("Erreur récupération utilisateur :", err);
          document.getElementById("nom").value = "Erreur";
          document.getElementById("prenom").value = "Erreur";
          document.getElementById("faculte").value = "Erreur";
          document.getElementById("pseudo2").value = "Erreur";
        
      });


});
  
//réinitialisation des champs infos 
const boutton=document.getElementById('button');
//vérification des champs après le click sur le boutton 

boutton.addEventListener('click',function(event){
  
let erreur=false;
let name=false;
let prename=false;
let pseudo=false;
let faculte=false;

    if(document.getElementById("nom").value.trim()===""){
        erreur=true;
        name=true;
        document.getElementById("nom").style.borderColor="red";
    }
    if(document.getElementById("prenom").value.trim()===""){
        erreur=true;
        prename=true;
        document.getElementById("prenom").style.borderColor="red";
    }
    if(document.getElementById("pseudo2").value.trim()===""){
        erreur=true;
        pseudo=true;
        document.getElementById("pseudo2").style.borderColor="red";
    }
    if(document.getElementById("faculte").value.trim()===""){
        erreur=true;
        faculte=true;
        document.getElementById("faculte").style.borderColor="red";
    }
    

if (erreur) {
    event.preventDefault();
    

}else {
    //toutes les informations sont correctement saisies 
     const user=document.getElementById('user');
     const currentavtr=user.getAttribute("src");
       //récuperation des données 
         //data est un objet (record)
    const data={
      nom:document.getElementById("nom").value.trim(),
      prenom:document.getElementById("prenom").value.trim(),
      pseudo:document.getElementById("pseudo2").value.trim(),
      faculte:document.getElementById("faculte").value.trim(),   
      avatar:currentavtr,       
    }
       //envoie des données au backend 
console.log("DATA ENVOYÉ :", data);
//evoie une requête HTTP a cette address
fetch(`/api/update`,{
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
    //si succss est true(inscription reussie)
    if (! result.success){ 
      
      alert("erreur:"+result.message);
      
    }else{

      
         sessionStorage.setItem("profilchange", "true");
         location.reload(); 

    }
   })
//gestion des erreurs du reseau (connection avec serveur )
.catch(error=>{
  console.error("erreur lors de l'envoi:",error);
  alert("impossible de contacter le serveur");
});


   
  }
//réinitialisation du champ nom 
document.getElementById("nom").addEventListener('input',()=>{
  champnom=true;
if(name){
document.getElementById("nom").style.borderColor = "";
document.getElementById("nom").classList.remove('valide');
document.getElementById("nom").addEventListener('blur',()=>{
if(document.getElementById("nom").value.length>0){
document.getElementById("nom").classList.add('valide');
}
});
}
}); 

//réinitialisation du champ prenom 
document.getElementById("prenom").addEventListener('input',()=>{
  champrenom=true;
if(prename){
document.getElementById("prenom").style.borderColor = "";
document.getElementById("prenom").classList.remove('valide');
document.getElementById("prenom").addEventListener('blur',()=>{
if(document.getElementById("prenom").value.length>0){
document.getElementById("prenom").classList.add('valide');
}

});

}});

//réinitialisation du champ prseudo
document.getElementById("pseudo2").addEventListener('input',()=>{
  champseudo=true;
if(pseudo){
document.getElementById("pseudo2").style.borderColor = "";
document.getElementById("pseudo2").classList.remove('valide');
document.getElementById("pseudo2").addEventListener('blur',()=>{
if(document.getElementById("pseudo2").value.length>0){
document.getElementById("pseudo2").classList.add('valide');
}

});

}});

//réinitialisation du champ faculté
document.getElementById("faculte").addEventListener('input',()=>{
  champfac=true;
if(faculte){
document.getElementById("faculte").style.borderColor = "";
document.getElementById("faculte").classList.remove('valide');
document.getElementById("faculte").addEventListener('blur',()=>{
if(document.getElementById("faculte").value.length>0){
document.getElementById("faculte").classList.add('valide');
}

});

}});


});