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



//---------vérification de l'email -----------------------------------------------------------------------------------------------
const email=document.getElementById('mailvalide');
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
   

 }else if(mailblur){
if(verifierEmail(valeurEmail)){
    mailinvalide=false;
    email.style.borderColor = "";
    email.classList.add('valide');   
    emailerror.style.display = "none";
    

}else{
     mailinvalide=true;
     email.style.borderColor = "red";
      emailerror.style.display = "block";
     
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
   
    email.classList.remove('valide');
 }else if (verifierEmail(valeurEmail)) {
      // Email valide
      mailinvalide=false;
      email.classList.add('valide');
      
      emailerror.style.display = "none";
    } else {
      // Email invalide
      mailinvalide=true;
      email.classList.remove('valide');
      email.style.borderColor = "red";
      
      emailerror.style.display = "block";
    }
  });
//---------vérification de l'email2 -----------------------------------------------------------------------------------------------
const email2=document.getElementById('mailvalide2');
const emailerror2=document.getElementById('mailinvalide2');
const titrenormal2=document.getElementById('titrenormal2');
let mailblur2=false;
let mailinvalide2=false;


   // Quand l'utilisateur tape dans le champ

 email2.addEventListener("input", () => {
    const valeurEmail = email2.value;
 if (valeurEmail === "") {
    //  Champ vide → remettre le titre normal
    email2.style.borderColor = ""; // couleur par défaut
    emailerror2.style.display = "none";
   

 }else if(mailblur2){
if(verifierEmail(valeurEmail)){
    mailinvalide2=false;
    email2.style.borderColor = "";
    email2.classList.add('valide');   
    emailerror2.style.display = "none";
    

}else{
     mailinvalide2=true;
     email2.style.borderColor = "red";
      emailerror2.style.display = "block";
     
      email2.classList.remove('valide');

}
 }});

  email2.addEventListener("blur", () => {
    const valeurEmail = email2.value;
    mailblur2=true;
 if (valeurEmail === "") {
    //  Champ vide → remettre le titre normal
    email2.style.borderColor = ""; // couleur par défaut
    emailerror2.style.display = "none";   
    email2.classList.remove('valide');
 }else if (verifierEmail(valeurEmail)) {
      // Email valide
      mailinvalide2=false;
      email2.classList.add('valide');
      
      emailerror2.style.display = "none";
    } else {
      // Email invalide
      mailinvalide2=true;
      email2.classList.remove('valide');
      email2.style.borderColor = "red";
      
      emailerror2.style.display = "block";
    }
  });

  //verification finale du boutton -----------------------------
const boutton=document.getElementById('boutton');


  
boutton.addEventListener('click', function(event) {
  let erreur = false;
  let mailchamp = false;
  let mailchamp2 = false;
  let passchamp = false;
    
  if ((email.value.trim() === "") || (mailinvalide == true)) {
    erreur = true;
    mailchamp = true;
    email.style.borderColor = "red";
  }
    
  if ((email2.value.trim() === "") || (mailinvalide2 == true)) {
    erreur = true;
    mailchamp2 = true;
    email2.style.borderColor = "red";      
  }

  if ((password.value.trim() === "")) {
    erreur = true;
    passchamp = true;
    password.style.borderColor = "red";
  }
 
  if (erreur) {
    event.preventDefault();
  } else {   
    fetch("/api/change-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newemail: email2.value,
        oldemail: email.value,
        password: password.value
      })
    })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        if (data.error === "password incorrect") {
          password.style.borderColor = "red";
          password.classList.remove('valide');     
          document.getElementById('missmatch').style.display="block";
          passchamp = true;
        }
        if (data.error === "email incorrect") {
          email.style.borderColor = "red";
          email.classList.remove('valide');     
          document.getElementById('mailincorrect').style.display="block";
          mailchamp = true;
        }
        if (response.status === 400) {
          email2.style.borderColor = "red";
          email2.classList.remove('valide');     
          document.getElementById('dejautilise').style.display="block";
          mailchamp2 = true;
        }
      } else {
       
    

        // On ne change pas l'email dans la session pour l'instant
        password.classList.add('valide'); 
        email.classList.add('valide'); 
        email2.classList.add('valide');     
        document.getElementById('missmatch').style.display="none";
        passchamp = false;
        mailchamp = false;
        mailchamp2 = false;
         // ✅ Popup temporaire pour informer l'utilisateur
        sessionStorage.setItem('emailchange','true');
         // 🔹 Recharge la page pour effacer les champs
        location.reload();
       
      }
    })
    .catch(error => {
      alert("Erreur réseau : " + error.message);
    });
  }

//réinitialisation du champ email 
email.addEventListener('input',()=>{
if(mailchamp){
email.style.borderColor = "";
email.classList.remove('valide');
document.getElementById('mailincorrect').style.display="none";
}});

email2.addEventListener('input',()=>{
if(mailchamp2){
email2.style.borderColor = "";
email2.classList.remove('valide');
document.getElementById('dejautilise').style.display="none";
}});


//réinitialisation du champ password 
password.addEventListener('input',()=>{
if(passchamp){
password.style.borderColor = "";
password.classList.remove('valide');
 document.getElementById('missmatch').style.display="none";
}});

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


          if(sessionStorage.getItem('emailchange') === 'true') {
        // 🔹 Supprimer le flag pour ne pas réafficher à nouveau
        sessionStorage.removeItem('emailchange');
          setTimeout(() => {
      const popup = document.createElement('div');
      // overlay flou
            const overlay = document.createElement('div');
            overlay.id = 'modal-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = 0;
            overlay.style.left = 0;
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.backdropFilter = 'blur(3px)';
            overlay.style.zIndex = '999';

            // popup modal
            const modal = document.createElement('div');
            modal.id = 'popup_email_info';
            modal.style.position = 'fixed';
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.backgroundColor = '#0077b6';
            modal.style.color = 'white';
            modal.style.padding = '25px 35px';
            modal.style.borderRadius = '10px';
            modal.style.boxShadow = '0 2px 15px rgba(0,0,0,0.3)';
            modal.style.fontSize = '18px';
            modal.style.fontWeight = 'bold';
            modal.style.zIndex = '1000';
            modal.style.textAlign = 'center';
            modal.innerText = "Vérifiez votre boîte e-mail et activez votre nouvelle adresse. Sinon, votre adresse précédente restera active.";

            // bouton fermer
            const closeBtn = document.createElement('button');
            closeBtn.innerText = "OK";
            closeBtn.style.marginTop = "15px";
            closeBtn.style.padding = "8px 15px";
            closeBtn.style.border = "none";
            closeBtn.style.borderRadius = "5px";
            closeBtn.style.backgroundColor = "#00b4d8";
            closeBtn.style.color = "white";
            closeBtn.style.cursor = "pointer";
            closeBtn.addEventListener('click', () => {
                overlay.remove();
                modal.remove();
            });

            modal.appendChild(closeBtn);
            document.body.appendChild(overlay);
            document.body.appendChild(modal);

      setTimeout(() => {
        popup.remove();
      }, 5000);
    }, 500); // délai court pour que la page ait le temps de reload
  }
           
        } else {
          document.getElementById("pseudo").textContent = "Inconnu";
          
        }
         
         
      })
      .catch(err => {
        console.error("Erreur récupération utilisateur :", err);
        document.getElementById("pseudo").textContent = "Erreur";
        
      });
  });
