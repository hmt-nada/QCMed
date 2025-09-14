// Charger le son
const clickSound = new Audio("../sounds/click2.mp3");

const errorSound = new Audio("../sounds/notification.mp3");

const main= document.getElementById('test1');
//input1 et 2 du nom et prenom
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
const email=document.getElementById('mailvalide');
const emailerror=document.getElementById('mailinvalide');
const emailerror2=document.getElementById('maildejautilise');
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
    emailerror2.style.display = "none";
    titrenormal.style.display = "block";

 }else if(mailblur){
if(verifierEmail(valeurEmail)){
    mailinvalide=false;
    email.style.borderColor = "";
    email.classList.add('valide');   
    emailerror.style.display = "none";
    emailerror2.style.display = "none";
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
    emailerror2.style.display = "none";
    titrenormal.style.display = "block";
    email.classList.remove('valide');
 }else if (verifierEmail(valeurEmail)) {
      // Email valide
      mailinvalide=false;
      email.classList.add('valide');
      titrenormal.style.display = "block";
      emailerror.style.display = "none";
      emailerror2.style.display = "none";
    } else {
      // Email invalide
      mailinvalide=true;
      email.classList.remove('valide');
      email.style.borderColor = "red";
      titrenormal.style.display = "none";
      emailerror.style.display = "block";
    }
  });


  //--mot de passe ----------------------------------------------------------------------------------------------

  const eyeclose1=document.getElementById('eyeclose1');
  const eyeopen1=document.getElementById('eyeopen1');
  const eyeclose2=document.getElementById('eyeclose2');
  const eyeopen2=document.getElementById('eyeopen2');
  const password=document.getElementById('password1');
  const confirmation=document.getElementById('password2');

   eyeclose1.addEventListener('click' ,() => {
   eyeclose1.style.display="none";
   eyeopen1.style.display="block";
   eyeclose1.classList.remove("visible");
   eyeclose1.classList.add("hidden");
   eyeopen1.classList.remove("hidden");
   eyeopen1.classList.add("visible");
   password.setAttribute("type","text");  
});

   eyeopen1.addEventListener('click' ,() => {
   eyeopen1.style.display="none";
   eyeclose1.style.display="block";
   eyeopen1.classList.remove("visible");
   eyeopen1.classList.add("hidden");
   eyeclose1.classList.remove("hidden");
   eyeclose1.classList.add("visible");
   password.setAttribute("type","password");
  });
   eyeclose2.addEventListener('click' ,() => {
   eyeclose2.style.display="none";
   eyeopen2.style.display="block";
   eyeclose2.classList.remove("visible");
   eyeclose2.classList.add("hidden");
   eyeopen2.classList.remove("hidden");
   eyeopen2.classList.add("visible");
   confirmation.setAttribute("type","text");
});
   eyeopen2.addEventListener('click' ,() => {
   eyeopen2.style.display="none";
   eyeclose2.style.display="block";
   eyeopen2.classList.remove("visible");
   eyeopen2.classList.add("hidden");
   eyeclose2.classList.remove("hidden");
   eyeclose2.classList.add("visible");
   confirmation.setAttribute("type","password");
});

//--------------------------------------------------------------------------------------------
  //verification longueur password 

  const mssgpass=document.getElementById('passrequest');
  const mssgerreur=document.getElementById('erreur');
  let champDéjàBlur = false;//pour mot de passe
  let passinvalid=false;
  

password.addEventListener('input',()=>{


  const firstpassword=password.value;
  const passwordconfirme=confirmation.value;

    if(firstpassword===""){
password.style.borderColor = "";
password.classList.remove('valide');
mssgerreur.style.display="none";
mssgpass.style.display="block";

    }else if (champDéjàBlur) {
    if (firstpassword.length < 6) {
   
      passinvalid=true;
      password.style.borderColor = "red";
      mssgerreur.style.display = "block";
      mssgpass.style.display = "none";
      password.classList.remove('valide');
    }
  
  else {
    passinvalid=false;
     password.style.borderColor = "";
    password.classList.add('valide');
    
   mssgerreur.style.display="none";
   mssgpass.style.display="block";
  }}
});
   
  password.addEventListener('blur',()=>{

 champDéjàBlur=true;
  const firstpassword=password.value;
  const passwordconfirme=confirmation.value;

    if(firstpassword===""){
password.style.borderColor = "";
password.classList.remove('valide');
mssgerreur.style.display="none";
mssgpass.style.display="block";
    }
else if(firstpassword.length < 6){
passinvalid=true;
mssgpass.style.display="none";
mssgerreur.style.display="block";
password.style.borderColor = "red";

}else{
passinvalid=false;
password.classList.add('valide');
mssgerreur.style.display="none";
mssgpass.style.display="block";
}
  });

  

  //verification confirmation password
  //-----------------------------------------------------
  const mssgerreur2=document.getElementById('erreur2');
  const mssgpass2=document.getElementById('passrequest2');
  let champblur=false;//pour confirmation
  let confinvalid=false;

confirmation.addEventListener('input',()=>{

  const firstpassword=password.value;
  const passwordconfirme=confirmation.value;

if(passwordconfirme===""){
confirmation.style.borderColor = "";
confirmation.classList.remove('valide');
mssgerreur2.style.display="none";
mssgpass2.style.display="block";

    }else if (champblur) {

    if (passwordconfirme!=firstpassword) {
        confinvalid=true;
     confirmation.style.borderColor = "red";
     confirmation.classList.remove('valide');
     mssgpass2.style.display="none";
     mssgerreur2.style.display="block";
    }
  
  else {
    confinvali=false;
     confirmation.style.borderColor = "";
     confirmation.classList.add('valide');
     mssgerreur2.style.display="none";
     mssgpass2.style.display="block";
  }}
});

confirmation.addEventListener('blur',()=>{
  champblur=true;
  const firstpassword=password.value;
  const passwordconfirme=confirmation.value;

if(passwordconfirme===""){
  confirmation.style.borderColor = "";
  confirmation.classList.remove('valide');
  mssgerreur2.style.display="none";
  mssgpass2.style.display="block";

}else if(passwordconfirme==firstpassword){
confinvalid=false;
confirmation.classList.add('valide');
}else{
confinvalid=true;
mssgpass2.style.display="none";
mssgerreur2.style.display="block";
confirmation.style.borderColor = "red";
}

});

//faculté


const selectFaculte = document.getElementById("faculte");
const champAutre = document.getElementById("autreFaculte");
const fleche = document.getElementById("fleche");

selectFaculte.addEventListener("change", () => {
  if (selectFaculte.value === "autre") {
    champAutre.style.display = "block";
    selectFaculte.style.display = "none";
    champAutre.focus();
    champAutre.required = true;
   fleche.style.display = "none"; 

  } else {
   
    champAutre.required = false;
    
    
  }
});




//verification finale du boutton -----------------------------
const boutton=document.getElementById('boutton');
const alertbox=document.getElementById('alert');
const nom=document.getElementById('nom');
const prenom=document.getElementById('prenom');
const faculte=document.getElementById('faculte');
const annee=document.getElementById('annee');
const valeurEmail = email.value;
const firstpassword=password.value;
const passwordconfirme=confirmation.value;

  
boutton.addEventListener('click',function(event){
 

let erreur=false;
let name=false;
let prename=false;
let facultechamp=false;
let anneechamp=false;
let mailchamp=false;
let passchamp=false;
let confirmchamp=false;

    if(nom.value.trim()===""){
        erreur=true;
        name=true;
        nom.style.borderColor="red";
    }
    if(prenom.value.trim()===""){
        erreur=true;
        prename=true;
        prenom.style.borderColor="red";
    }
    if((email.value.trim()==="") || (mailinvalide==true)){
        erreur=true;
        mailchamp=true;
        email.style.borderColor="red";
    }
    if((password.value.trim()==="") || (passinvalid==true)){
        erreur=true;
        passchamp=true;
        password.style.borderColor="red";
    }
    if((confirmation.value.trim()==="") || (confinvalid==true)){
        erreur=true;
        confirmchamp=true;
        confirmation.style.borderColor="red";
    }
if (faculte.value === "") {
    faculte.style.borderColor = "red";
    erreur = true;
  }

  if (faculte.value === "autre" && autreFaculte.value.trim() === "") {
    autreFaculte.style.borderColor = "red";
    erreur = true;
  }

  if (annee.value === "") {
    annee.style.borderColor = "red";
    erreur = true;
  }
if (erreur) {
    event.preventDefault();
    errorSound.currentTime = 0; // remet au début si on reclique rapidement
        errorSound.play();
    // Supprimer d’abord pour éviter les doublons
    alertbox.classList.remove("visible"); // Réinitialise l'état
void alertbox.offsetWidth; // Force le navigateur à re-calculer l'animation
alertbox.classList.add("visible"); // Relance l'animation

// Disparaît au bout de 4 secondes
setTimeout(() => {
  alertbox.classList.remove("visible");
}, 2000);

}else {
    //toutes les informations sont correctement saisies 

       //récuperation des données 
         //data est un objet (record)
    const data={
      nom:nom.value.trim(),
      prenom:prenom.value.trim(),
      faculte:faculte.value=="autre" ? champAutre.value.trim():faculte.value,     
      annee:annee.value.trim(),
      email:email.value.trim(),
      password:password.value.trim(),
      confirmation:confirmation.value.trim(),      
      }
       //envoie des données au backend 

//evoie une requête HTTP a cette address
fetch("/api/inscription",{
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
    if (result.success){ 
      //stocker l'email dans le navigateur 
       sessionStorage.setItem("emailInscrit", email.value.trim());
      email.style.borderColor = "";
      titrenormal.style.display = "block";
      emailerror2.style.display = "none";
       clickSound.currentTime = 0; // remet au début si on reclique rapidement
        clickSound.play();
      window.location.href = "pseudo.html";
      
    }else{
      email.style.borderColor = "red";
      titrenormal.style.display = "none";
      emailerror2.style.display = "block";
     // Effet clignotement sur "connectez-vous"
  document.getElementById('login').classList.add("zoom");
  setTimeout(() => {
    document.getElementById('login').classList.remove("zoom");
  }, 2000);
    }
   })
//gestion des erreurs du reseau (connection avec serveur )
.catch(error=>{
  console.error("erreur lors de l'envoi:",error);
  alert("impossible de contacter le serveur");
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
//réinitialisation du champ prenom 
prenom.addEventListener('input',()=>{
if(prename){
prenom.style.borderColor = "";
prenom.classList.remove('valide');
prenom.addEventListener('blur',()=>{
if(prenom.value.length>0){
prenom.classList.add('valide');
}

});

}});
//réinitialisation du champ email 
email.addEventListener('input',()=>{
if(mailchamp){
email.style.borderColor = "";
email.classList.remove('valide');
}});
//réinitialisation du champ password 
password.addEventListener('input',()=>{
if(passchamp){
password.style.borderColor = "";
password.classList.remove('valide');
}});
//réinitialisation du champ confirmation 
confirmation.addEventListener('input',()=>{
if(confirmchamp){
confirmation.style.borderColor = "";
confirmation.classList.remove('valide');
}});
faculte.addEventListener('change', () => {
  faculte.style.borderColor = "";
});
champAutre.addEventListener('input', () => {
  autreFaculte.style.borderColor = "";
});
annee.addEventListener('change', () => {
  annee.style.borderColor = "";
});

});

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

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && input.value === '' && index > 0) {
      inputs[index - 1].focus();
    }
  });
});

//--------------------------------------------------------------------------------------------------------
 
