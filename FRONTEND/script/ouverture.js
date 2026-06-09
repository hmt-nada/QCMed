const start=document.getElementById('btncommencer');

start.addEventListener('click',()=>{
// Vérification de la session et année validée
  fetch(`/api/check-status`)
    .then(res => res.json())
    
       .then(data => {
    const anneeValid = Number(data.annee_validated) === 1; // 🔥 forcer en nombre
    if (!data.session) {
        window.location.href = "inscription.html";
    } else if (anneeValid) {
        window.location.href = "accueil.html";
    } else {
        window.location.href = "check-validation.html";
    }


    });
});


window.addEventListener('load', () => {
  const delayLogo = 2500; // durée de shrinkOut du logo

  setTimeout(() => {
    const squares = [document.querySelector('.square01'),
                     document.querySelector('.square02'),
                     document.querySelector('.square03')];

    squares.forEach((sq, index) => {
      setTimeout(() => {
        sq.style.animation = 'slideDown 0.8s forwards';
      }, index * 300); // chaque carré après 0.3s du précédent
    });

        // Ajouter la classe 'visible' aux éléments à faire glisser
        document.querySelector('.titreouv').classList.add('visible');
        document.querySelector('.menu-float').classList.add('visible');
        document.querySelector('.btn-start').classList.add('visible');
    
  }, delayLogo);
});
