window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("choix");
  const token = params.get("token");
  const id = params.get("id");
  const felicitation=document.getElementById("felicitation");
  const echec=document.getElementById("echec");
  const anim = document.getElementById("animation");

  fetch("/api/choix-annee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id, choix: type, token: token })
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        // 🔹 Affiche l’animation UNIQUEMENT si validé
        if (type === "reste") anim.textContent = "💪 Courage pour continuer cette année !";
        else if (type === "passe") anim.textContent = "🎉 Félicitations pour ton passage au niveau supérieur !";
        else anim.textContent = "Bienvenue !";

        // 🔹 Stocker email
        sessionStorage.setItem("emailInscrit", result.email);

        // Redirection après 2s
        setTimeout(() => window.location.href = "accueil.html", 2000);
      } 
      else if (result.alreadyValidated) {
        anim.textContent = "⚠️ Cette validation a déjà été faite. Le lien n’est plus actif.";
      } 
      else {
        anim.textContent = "❌ Erreur lors de la validation.";
      }
    })
    .catch(err => {
      console.error(err);
      anim.textContent = "⚠️ Problème de connexion au serveur.";
    });
});
