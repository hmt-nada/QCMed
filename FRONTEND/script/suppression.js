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
//afficher le pseudo et avatar 
window.addEventListener("DOMContentLoaded", () => {

 if (sessionStorage.getItem("suppression") === "true") {
  
document.getElementById('alert_erreur').classList.remove("visible"); // pour reset
void document.getElementById('alert_erreur').offsetWidth; // forcer le recalcul CSS
       document.getElementById('alert_erreur').classList.add("visible");

  // Cacher l'alerte après 3 secondes
  setTimeout(() => {
    document.getElementById('alert_erreur').classList.remove("visible");
    
// Rediriger vers la page de inscription
  window.location.href = 'ouverture.html'; 
  }, 2000);
 }


    fetch(`/api/utilisateur`)
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

  //verification finale du boutton -----------------------------
const boutton=document.getElementById('supprimer');
  
boutton.addEventListener('click',function(event){
let erreur=false;
let passchamp1=false;


    if((password.value.trim()==="") ){
        erreur=true;
        passchamp1=true;
        password.style.borderColor="red";
    }
 
if (erreur) {
event.preventDefault();
     

}else { 
  event.preventDefault();
  

  fetch("/api/suppression", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      password: password.value
      
    })
  })
  
  .then(response => response.json())
  .then(data => {
    if (data.message) {
     
      document.getElementById('password1').classList.add('valide');     
      document.getElementById('missmatch').style.display="none";
      passchamp1=false;
      
      sessionStorage.setItem("suppression", "true");
      location.reload();
      
      

    } else if (data.error ) {
     document.getElementById('password1').style.borderColor = "red";
     document.getElementById('password1').classList.remove('valide');     
     document.getElementById('missmatch').style.display="block";
     passchamp1=true;

    }
  })
  .catch(error => {
    alert("Erreur réseau : " + error.message);
  });

}


//réinitialisation du champ password 
password.addEventListener('input',()=>{
if(passchamp1){
password.style.borderColor = "";
password.classList.remove('valide');
document.getElementById('missmatch').style.display="none";
}});


});
