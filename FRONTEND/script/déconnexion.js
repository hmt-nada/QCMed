//afficher le pseudo et avatar 
window.addEventListener("DOMContentLoaded", () => {
   
    fetch(`/api/utilisateur`, {
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
  document.getElementById('deconnexion').addEventListener('click',()=>{

// Appeler le backend pour détruire la session
  fetch(`/api/deconnexion`, { method: "POST" })
    .then(res => res.json())
    .then(data => {
      console.log(data.message);

      // Afficher ton alerte
      document.getElementById('alert_erreur').classList.remove("visible");
      void document.getElementById('alert_erreur').offsetWidth; 
      document.getElementById('alert_erreur').classList.add("visible");

      // Redirection après 2s
      setTimeout(() => {
        document.getElementById('alert_erreur').classList.remove("visible");
        window.location.href = 'ouverture.html'; 
      }, 2000);
    })
    .catch(err => {
      console.error("Erreur déconnexion :", err);
    });
  
  });