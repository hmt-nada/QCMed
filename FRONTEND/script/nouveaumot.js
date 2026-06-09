const titre= document.getElementById('inscrivez');

  window.addEventListener('load', function() {
   titre.classList.add('slide-in');
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

//verification finale du boutton -----------------------------
const boutton=document.getElementById('boutton');

const alert=document.getElementById('alert');
const alert2=document.getElementById('alert2');
const firstpassword=password.value;
const passwordconfirme=confirmation.value;


  
boutton.addEventListener('click',function(event){
   
let erreur=false;
let passchamp=false;
let confirmchamp=false;

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
    
   const email = sessionStorage.getItem("emailInscrit"); // Récupère l'email stocké

  fetch(`/api/new-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password.value
      
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message) {
     
      passchamp=false;
      sessionStorage.setItem("passwordSuccess", "true");
      location.reload(); 
    
    } else if (data.error ) {
     document.getElementById('password').style.borderColor = "red";
     document.getElementById('password').classList.remove('valide');     
     passchamp=true;

    }
  })
  .catch(error => {
    alert("Erreur réseau : " + error.message);
  });

  }
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
 
window.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("passwordSuccess") === "true") {

  alert2.classList.remove("visible"); // Réinitialise l'état
    void alert2.offsetWidth; // Force le navigateur à re-calculer l'animation
    alert2.classList.add("visible"); // Relance l'animation

   // Disparaît au bout de 4 secondes
   setTimeout(() => {
  alert2.classList.remove("visible");
   window.location.href = "accueil.html";
   }, 900);
   sessionStorage.removeItem("passwordSuccess");
  }
  });