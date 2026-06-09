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

//---------vérification de l'email -----------------------------------------------------------------------------------------------
const email=document.getElementById('email');
const emailerror=document.getElementById('mailinvalide');
const titrenormal=document.getElementById('titrenormal');
let mailblur=false;
let mailinvalide=false;

// Fonction pour vérifier si l'email est valide
  function verifierEmail(email) {
    // Expression régulière (regex) simple pour les emails
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email); // retourne true si c'est bon, sinon false
  }
   // Quand l'utilisateur tape dans le champ

 email.addEventListener("input", () => {
    const valeurEmail = email.value;
 if (valeurEmail === "") {
    //  Champ vide → remettre le titre normal
    email.style.borderColor = ""; // couleur par défaut
    emailerror.style.display = "none";
    titrenormal.style.display = "block";

 }else if(mailblur){
if(verifierEmail(valeurEmail)){
    mailinvalide=false;
    email.style.borderColor = "";
    email.classList.add('valide');   
    emailerror.style.display = "none";
    titrenormal.style.display = "block";

}else{
     mailinvalide=true;
     email.style.borderColor = "red";
      emailerror.style.display = "block";
      titrenormal.style.display = "none";
      email.classList.remove('valide');

}
 }});

  email.addEventListener("blur", () => {
    const valeurEmail = email.value;
    mailblur=true;
 if (valeurEmail === "") {
    //  Champ vide → remettre le titre normal
    email.style.borderColor = ""; // couleur par défaut
    emailerror.style.display = "none";
    titrenormal.style.display = "block";
    email.classList.remove('valide');
 }else if (verifierEmail(valeurEmail)) {
      // Email valide
      mailinvalide=false;
      email.classList.add('valide');
      titrenormal.style.display = "block";
      emailerror.style.display = "none";
    } else {
      // Email invalide
      mailinvalide=true;
      email.classList.remove('valide');
      email.style.borderColor = "red";
      titrenormal.style.display = "none";
      emailerror.style.display = "block";
    }
  });


  //verification finale du boutton -----------------------------
const boutton=document.getElementById('boutton');
const alert=document.getElementById('alert');
const alert2=document.getElementById('alert_erreur');
const nom=document.getElementById('nom');
const valeurEmail = email.value;
const message=document.getElementById('message2');
const form = document.getElementById('form'); // id de ton formulaire
boutton.addEventListener('click',function(event){
let erreur=false;
let name=false;
let mailchamp=false;
let mssgchamp=false;


    if(nom.value.trim()===""){
        erreur=true;
        name=true;
        nom.style.borderColor="red";
    }
    if(message.value.trim()===""){
        erreur=true;
        mssgchamp=true;
        message.style.borderColor="red";
    }
    if((email.value.trim()==="") || (mailinvalide==true)){
        erreur=true;
        mailchamp=true;
        email.style.borderColor="red";
    }
    
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
  
    event.preventDefault(); // Empêche le rechargement de page
    // Récupérer les valeurs
    const nom = document.getElementById('nom').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message2').value.trim();

    // Vérifications côté client
    if (!nom || !email || !message) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
    }

    
       fetch(`/api/contact-mail`, { // URL côté serveur
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, email, message })
        })

         .then(response=>response.json())
   //result une variable qui contient la réponse du serveur 
   .then(result =>{

        if (result.success) {
            alert2.classList.remove("visible"); // Réinitialise l'état
    void alert2.offsetWidth; // Force le navigateur à re-calculer l'animation
    alert2.classList.add("visible"); // Relance l'animation

    // Disparaît au bout de 4 secondes
    setTimeout(() => {
       alert2.classList.remove("visible");
       window.location.href = "accueil.html";
    }, 2000);
            form.reset();
        } else {
            alert('Erreur lors de l’envoi : ' + result.error);
        }
 })
    .catch (err =>{
        alert('Impossible de contacter le serveur.');
        console.error(err);
    });   
    
  }
//réinitialisation du champ nom 
nom.addEventListener('input',()=>{
if(name){
nom.style.borderColor = "";
nom.classList.remove('valide');
nom.addEventListener('blur',()=>{
if(nom.value.length>0){
nom.classList.add('valide');
}
});
}
});  
//réinitialisation du champ message
message.addEventListener('input',()=>{
if(mssgchamp){
message.style.borderColor = "";
message.classList.remove('valide');
message.addEventListener('blur',()=>{
if(message.value.length>0){
message.classList.add('valide');
}

});

}});
//réinitialisation du champ email 
email.addEventListener('input',()=>{
if(mailchamp){
email.style.borderColor = "";
email.classList.remove('valide');
}});
});

  const button = document.querySelector('.c-button--gooey');
  button.addEventListener('click', () => {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  });

