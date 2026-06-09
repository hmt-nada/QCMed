const titre= document.getElementById('inscrivez');
const minuteur = document.getElementById("minuteur");

let timerInterval = null;
let tempsRestant = 90_000; // 90 secondes
// Timer
function startTimer() {
  tempsRestant = 90_000;
 clearInterval(timerInterval);


  timerInterval = setInterval(() => {
    tempsRestant -= 1000;
    const min = Math.floor(tempsRestant / 60000).toString().padStart(2, '0');
    const sec = Math.floor((tempsRestant % 60000) / 1000).toString().padStart(2, '0');
    compteur.textContent = `${min}:${sec}`;

    if (tempsRestant <= 0) {
      clearInterval(timerInterval);
      compteur.textContent = "00:00";
       document.getElementById("valider-code").disabled = true;
    }
  }, 1000);
   document.getElementById("valider-code").disabled = false;
}




  window.addEventListener('load', function() {
   titre.classList.add('slide-in');
  });

   //---------vérification de l'email -----------------------------------------------------------------------------------------------
const email=document.getElementById('mailvalide');
const emailerror=document.getElementById('mailinvalide');
const titrenormal=document.getElementById('titrenormal');
let mailblur=false;
let mailinvalide=false;
let codeEnvoye = '';    // code généré côté serveur
const champCodeInputs = document.querySelectorAll('.code-input');
// Fonction utilitaire pour vérifier les six champs du code
function lireCode() {
  return [...champCodeInputs].map(inp => inp.value.trim()).join('');
}
// Fonction pour vérifier si l'email est valide
  function verifierEmail(email) {
    // Expression régulière (regex) simple pour les emails
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email); // retourne true si c'est bon, sinon false
  }
   // Quand l'utilisateur tape dans le champ

 email.addEventListener("input", () => {
  
 if ( email.value === "") {
    //  Champ vide → remettre le titre normal
    email.style.borderColor = ""; // couleur par défaut
    emailerror.style.display = "none";
    titrenormal.style.display = "block";

 }else if(mailblur){
if(verifierEmail( email.value)){
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
   
    mailblur=true;
 if ( email.value === "") {
    //  Champ vide → remettre le titre normal
    email.style.borderColor = ""; // couleur par défaut
    emailerror.style.display = "none";
    titrenormal.style.display = "block";
    email.classList.remove('valide');
 }else if (verifierEmail( email.value)) {
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

  const inputs = document.querySelectorAll('.code-input');

inputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }else if(index === inputs.length - 1){
      input.blur();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && input.value === '' && index > 0) {
      inputs[index - 1].focus();
    }
  });
});

 
const boutton1=document.getElementById('envoyer-code');

const alert=document.getElementById('alert');
const alert2=document.getElementById('alert2');

boutton1.addEventListener('click', function(event){

let erreur=false;
let mailchamp=false;
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
   sessionStorage.setItem("emailInscrit", email.value);
   event.preventDefault();
// Appel backend pour envoyer le code
   fetch(`/api/envoyer-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email:  email.value.trim() })
  })
  .then(async (response)=>{
const data=await response.json();
console.log(data);
 if (data.error === "Utilisateur introuvable") {
     //email introuable dans db
     mailchamp=true;
     email.classList.remove('valide');
     email.style.borderColor = "red";
    titrenormal.style.display = "none";
    document.getElementById('mailincorrect').style.display = "block";

  }else{  

    document.getElementById('partie2').style.display="block";
    document.getElementById('boite').classList.remove('new0');
    document.getElementById('boite').classList.add('new1');
    inputs[0].focus();
    //envoyer le code par e-mail 

     alert2.classList.remove("visible"); // Réinitialise l'état
    void alert2.offsetWidth; // Force le navigateur à re-calculer l'animation
alert2.classList.add("visible"); // Relance l'animation

// Disparaît au bout de 4 secondes
setTimeout(() => {
  alert2.classList.remove("visible");
}, 2000); 

 startTimer();
 document.getElementById("valider-code").disabled = false;


  }})


.catch(error => {
    alert("Erreur réseau : " + error.message);
  });


}
  //réinitialisation du champ email 
email.addEventListener('input',()=>{
if(mailchamp){
email.style.borderColor = "";
email.classList.remove('valide');
document.getElementById('mailincorrect').style.display = "none";
}});

});



const renvoyer=document.getElementById('renvoyer');
const alert3=document.getElementById('alert3');
const alert1=document.getElementById('alert1');
const alert4=document.getElementById('alert4');
const champ1=document.getElementById('champ1');
const champ2=document.getElementById('champ2');
const champ3=document.getElementById('champ3');
const champ4=document.getElementById('champ4');
const champ5=document.getElementById('champ5');
const champ6=document.getElementById('champ6');


renvoyer.addEventListener('click',()=>{
  fetch(`/api/renvoyer-code`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.value.trim() })
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
           alert3.classList.remove("visible"); // Réinitialise l'état
    void alert3.offsetWidth; // Force le navigateur à re-calculer l'animation
alert3.classList.add("visible"); // Relance l'animation

// Disparaît au bout de 4 secondes
setTimeout(() => {
  alert3.classList.remove("visible");
}, 2000);
             startTimer();
             document.getElementById("valider-code").disabled = false;
        } else {
            message.textContent = "❌ Erreur lors de l'envoi du code";
        }
    });
   //renvoyer le code par e-mail 
     
} );

const boutton=document.getElementById('valider-code');
boutton.addEventListener('click',async function(event){
   
   
    let videcode=false;
    

    if((champ1.value.trim()==="") ){
        videcode=true;
      
        champ1.style.borderColor="red";
    }
    if((champ2.value.trim()==="")){
        videcode=true;
       
        champ2.style.borderColor="red";
    }
    if((champ3.value.trim()==="")){
        videcode=true;
       
        champ3.style.borderColor="red";
    }
    if((champ4.value.trim()==="")){
        videcode=true;
        
        champ4.style.borderColor="red";
    }
    if((champ5.value.trim()==="")){
        videcode=true;
       
        champ5.style.borderColor="red";
    }
    if((champ6.value.trim()==="")){
        videcode=true;
        
        champ6.style.borderColor="red";
    }


    if(videcode){
        //le code est vide
        event.preventDefault();
    // Supprimer d’abord pour éviter les doublons
    alert1.classList.remove("visible"); // Réinitialise l'état
    void alert1.offsetWidth; // Force le navigateur à re-calculer l'animation
    alert1.classList.add("visible"); // Relance l'animation

    // Disparaît au bout de 4 secondes
   setTimeout(() => {
  alert1.classList.remove("visible");
}, 2000);

  }else{

    const code = lireCode();

fetch(`/api/verifier-code`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.value.trim(), code: code }),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {

alert4.classList.remove("visible"); // Réinitialise l'état
    void alert4.offsetWidth; // Force le navigateur à re-calculer l'animation
    alert4.classList.add("visible"); // Relance l'animation

     // Disparaît au bout de 4 secondes
    setTimeout(() => {
      alert4.classList.remove("visible");
      window.location.href = "nouveaumot.html";
}, 1000);

clearInterval(timerInterval);

            
        } else {
    document.getElementById('alert5').classList.remove("visible"); // Réinitialise l'état
    void document.getElementById('alert5').offsetWidth; // Force le navigateur à re-calculer l'animation
    document.getElementById('alert5').classList.add("visible"); // Relance l'animation

     // Disparaît au bout de 4 secondes
    setTimeout(() => {
      document.getElementById('alert5').classList.remove("visible");
     
}, 1000);
        }
    })
    .catch((err) => {
        message.textContent = "Erreur de vérification";
    });

  }
//réinitialisation du champ1 
champ1.addEventListener('input',()=>{

champ1.style.borderColor = "";
champ1.classList.remove('valide');
});
//réinitialisation du champ1 
champ2.addEventListener('input',()=>{

champ2.style.borderColor = "";
champ2.classList.remove('valide');
});
//réinitialisation du champ1 
champ3.addEventListener('input',()=>{

champ3.style.borderColor = "";
champ3.classList.remove('valide');
});
//réinitialisation du champ1 
champ4.addEventListener('input',()=>{
champ4.style.borderColor = "";
champ4.classList.remove('valide');
});
//réinitialisation du champ1 
champ5.addEventListener('input',()=>{
champ5.style.borderColor = "";
champ5.classList.remove('valide');
});
//réinitialisation du champ1 
champ6.addEventListener('input',()=>{
champ6.style.borderColor = "";
champ6.classList.remove('valide');
});




});






