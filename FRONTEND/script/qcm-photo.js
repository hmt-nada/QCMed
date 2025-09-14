const introData = [
  { chiffre: "3", texte: "Prépare-toi..." },
  { chiffre: "2", texte: "Concentre-toi..." },
  { chiffre: "1", texte: "C'est parti !" }
];

const messageDiv = document.getElementById('message');
const chiffreDiv = document.getElementById('chiffre');
const texteDiv = document.getElementById('texte');
const intro = document.getElementById('intro-animation');


let i = 0;

function showNext() {
  const bloc = introData[i];
  chiffreDiv.textContent = bloc.chiffre;
  texteDiv.textContent = bloc.texte;
  messageDiv.classList.add('show');

  setTimeout(() => {
    messageDiv.classList.remove('show');
    i++;
    if (i < introData.length) {
      setTimeout(showNext, 700); // délai entre blocs
    } else {
      setTimeout(() => {
        intro.style.display = 'none';
       
      }, 1000);
    }
  }, 1600);
}

window.addEventListener('DOMContentLoaded', showNext);

const reponses = document.querySelectorAll('.eachresponse');

reponses.forEach((reponse) => {

  reponse.addEventListener('click', () => {
    // Étape 1 : effet de clic rapide (pression visuelle)
  reponse.style.transform = "scale(0.96)";

    setTimeout(() => {
      // Étape 2 : toggle classe active
      reponse.classList.toggle('active');

      // Étape 3 : appliquer taille selon état actif
      if (reponse.classList.contains('active')) {
        reponse.style.transform = "scale(1.02)";
      } else {
        reponse.style.transform = "scale(1)";
      }
    }, 100); // délai pour simuler "pression"
  });
});

const compteur = document.getElementById('compteur');
let tempsRestant = 90; // en secondes (1 min 30 s)

function mettreAJourCompteur() {
  let minutes = Math.floor(tempsRestant / 60);
  let secondes = tempsRestant % 60;
  compteur.textContent = 
    `${minutes.toString().padStart(2, '0')}:${secondes.toString().padStart(2, '0')}`;
  
  if (tempsRestant <= 0) {
    clearInterval(intervale);
    compteur.textContent = "Temps écoulé";
    // désactiver les champs ou bouton ici :
    document.getElementById("valider-code").disabled = true;
    // tu peux aussi afficher un bouton "Renvoyer le code"
  } else {
    tempsRestant--;
  }
}
const intervale = setInterval(mettreAJourCompteur, 1000);