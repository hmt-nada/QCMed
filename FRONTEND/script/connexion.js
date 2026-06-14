const titre = document.getElementById('inscrivez');
if (titre) {
  window.addEventListener('load', function() {
    titre.classList.add('slide-in');
  });
}

//---------vérification de l'email -----------------------------------------------------------------------------------------------
const email = document.getElementById('mailvalide');
const emailerror = document.getElementById('mailinvalide');
const titrenormal = document.getElementById('titrenormal');
let mailblur = false;
let mailinvalide = false;

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


  const eyeclose1=document.getElementById('eyeclose1');
  const eyeopen1=document.getElementById('eyeopen1');
   const password=document.getElementById('password1');

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

  

  const mssgpass=document.getElementById('passrequest');
  const mssgerreur=document.getElementById('erreur');
  let champDéjàBlur = false;//pour mot de passe
  let passinvalid=false;
  


function showAdminModal(onChoice) {
  const modal = document.getElementById('adminModal');
  const closeBtn = modal.querySelector('.close-btn');
  const adminBtn = modal.querySelector('#admin-btn');
  const userBtn = modal.querySelector('#user-btn');

  modal.style.display = 'flex';

  // Fermeture
  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; }

  // Choix Admin
  adminBtn.onclick = () => { modal.style.display = 'none'; onChoice('admin'); }
  userBtn.onclick = () => { modal.style.display = 'none'; onChoice('user'); }
}


    
  

  //verification finale du boutton -----------------------------
const boutton=document.getElementById('boutton');
const alertBox = document.getElementById('alert');


boutton.addEventListener('click',function(event){
  const valeurEmail = email.value;
const firstpassword=password.value;
let erreur=false;
let mailchamp=false;
let passchamp=false;

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
    if (erreur) {
    event.preventDefault();
    // Supprimer d’abord pour éviter les doublons
    alertBox.classList.remove("visible"); // Réinitialise l'état
void alertBox.offsetWidth; // Force le navigateur à re-calculer l'animation
alertBox.classList.add("visible"); // Relance l'animation

// Disparaît au bout de 4 secondes
setTimeout(() => {
  alertBox.classList.remove("visible");
}, 2000);

}else {

  fetch(`/api/connexion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })
  
  .then(async (response)=>{
    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      if (data?.error === "Mot de passe incorrect") {
      //mot de passe incorrect
     password.style.borderColor = "red";
     password.classList.remove('valide');     
     document.getElementById('missmatch').style.display="block";
     mssgpass.style.display="none";
     passchamp=true;

     }
     if (data.error ==="Utilisateur introuvable") {
      //email est incorrect 
     email.style.borderColor = "red";
     email.classList.remove('valide');     
     document.getElementById('mailincorrect').style.display="block";
     titrenormal.style.display = "none";
     mailchamp=true;
     }
    }else{
  
      password.classList.add('valide'); 
      email.classList.add('valide');      
      document.getElementById('missmatch').style.display="none";
      document.getElementById('mailincorrect').style.display="none";
      passchamp=false;
      mailchamp=false;
      

       document.getElementById('alert_erreur').classList.remove("visible"); // pour reset
void document.getElementById('alert_erreur').offsetWidth; // forcer le recalcul CSS
       document.getElementById('alert_erreur').classList.add("visible");

  // Cacher l'alerte après 3 secondes
  // Cacher l'alerte après 2-3 secondes
setTimeout(() => {
  document.getElementById('alert_erreur').classList.remove("visible");

  // ✅ Redirection selon isAdmin
  const isAdmin = data?.utilisateur?.isAdmin === true;
  if (isAdmin) {
    window.location.href = 'panel.html';
  } else {
    window.location.href = 'accueil.html';
  }

}, 2000);

     
     
    }
   
  })
  .catch(error => {
  console.error("Erreur réseau : " + error.message);
});


    
  }
  //réinitialisation du champ email 
email.addEventListener('input',()=>{
if(mailchamp){
email.style.borderColor = "";
email.classList.remove('valide');
document.getElementById('mailincorrect').style.display="none";

}});
//réinitialisation du champ password 
password.addEventListener('input',()=>{
if(passchamp){
password.style.borderColor = "";
password.classList.remove('valide');
document.getElementById('missmatch').style.display="none";
mssgpass.style.display="block";
}});
});


const button = document.querySelector('.c-button--gooey');
  button.addEventListener('click', () => {
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
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

});