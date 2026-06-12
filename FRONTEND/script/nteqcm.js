

let currentNote = null;
let correctionMode = null;
let fullmark = false;




function remarkqcm(score){
  let remarque = "";

if (score <= 4) {
  remarque = "Travail insuffisant,une révision approfondie est nécessaire.";
} else if (score > 4 && score <= 8) {
  remarque = "Travail insuffisant, des efforts visibles mais trop d’erreurs persistent.";
} else if (score > 8 &&score <= 11) {
  remarque = "Travail moyen, mais trop de points restent approximatifs.";
} else if (score > 11 &&score <= 14) {
  remarque = "Travail satisfaisant, mais il faut consolider la maîtrise.";
} else if (score > 14 &&score <= 17) {
  remarque = "Travail très satisfaisant, quelques détails à améliorer.";
} else if (score > 17 && score <= 20) {
  remarque = "Excellent travail, une excellente maîtrise du sujet.";
} 
return remarque;
}

// au chargement, récupérer la note
document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch(`/api/get-note`);
    const data = await res.json();

    if (data.note !== null) {
        currentNote = data.note;
        correctionMode = data.correction || false;

        if (data.full && data.full.length) {
            // fullmark = vrai si toutes correctes
            fullmark = data.full.every(q => q.isCorrect === true);
        }
        // 🔹 Afficher la note si on est en mode avec correction
        const noteElement = document.getElementById("lanote");
        const remarkElement = document.getElementById("remark");
        const remarkElement2 = document.getElementById("remark2");
        const note = document.getElementById("note");
         
        if (correctionMode) {
            note.style.display='block';         
            noteElement.textContent = `Votre note selon le mode ${correctionMode} est :`;            
            note.textContent = `${currentNote}/20`;
        } else{
          note.style.display='none';
          remarkElement2.textContent = `Évaluation de ton travail :`;
          remarkElement.textContent = `${remarkqcm(currentNote)}`;
        }
        // Vérifier s'il existe une ancienne note dans sessionStorage
const oldNoteData = sessionStorage.getItem("noteAvant");
if (oldNoteData) {
    const oldNote = JSON.parse(oldNoteData).note;
    const newNote = currentNote;

    // Afficher popup seulement si la note a augmenté
    if (newNote > oldNote) {
      if(correctionMode){
showPopupAmelioration(oldNote, newNote, true);
      }else{
        showPopupAmelioration(oldNote, newNote, false);
      }
        
    }

    // Nettoyer pour éviter de le réafficher plusieurs fois
    sessionStorage.removeItem("noteAvant");
}
    }

    console.log("Note :", currentNote, "Correction :", correctionMode, "Fullmark:", fullmark);
});


  const popup = document.getElementById("popup");
  const btnCorrige = document.getElementById("btnCorrige");
  const btnAll = document.getElementById("corrigeAll");
  const btnFalse = document.getElementById("corrigeFalse");
  const btnCancel = document.getElementById("cancel");
  const btnrefais = document.getElementById("btnrefais");
  function showPopup() {
  const popup3 = document.getElementById('popupSucces');
  popup3.classList.add('show');
  setTimeout(() => {
    popup3.classList.remove('show');
  }, 3000); // disparaît après 3 secondes
}

function closePopup() {
  const popup3 = document.getElementById('popupSucces');
  popup3.classList.remove('show');
}

  // Ouvrir le popup
  btnCorrige.addEventListener("click", () => {
    popup.style.display = "flex";
  });

  // Corrigé complet
  btnAll.addEventListener("click", () => {
    popup.style.display = "none";
    // Ici tu mets ton code pour afficher le corrigé complet
    window.location.href ="corrigetous.html?mode=tous";
  });

  // Corrigé seulement des fausses

  btnFalse.addEventListener("click", () => {
    popup.style.display = "none";
    if (fullmark) {
        showPopup(); // déjà toutes correctes
    } else {
        window.location.href = "corrigefausse.html?mode=faux";
    }
});

  // Annuler
  btnCancel.addEventListener("click", () => {
    popup.style.display = "none";
  });
  // nouvelle tetative
  btnrefais.addEventListener("click", () => {
    if (fullmark) {
        showPopup(); // toutes correctes, pas de retentative
    } else {
        if (currentNote !== null) {
            sessionStorage.setItem("noteAvant", JSON.stringify({ note: currentNote }));
        }
        window.location.href="qcm.html?mode=retry";
    }
});
  


function launchConfettiFromCorner(cornerX, cornerY) {
    const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];
    for (let i = 0; i < 15; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      document.body.appendChild(confetti);

      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = cornerX === "left" ? "0px" : window.innerWidth - 10 + "px";
      confetti.style.top = cornerY === "top" ? "0px" : window.innerHeight - 10 + "px";

      // direction aléatoire
      const angle = Math.random() * Math.PI / 2; // 90° selon le coin
      let adjustedAngle;
      if (cornerX === "left" && cornerY === "top") adjustedAngle = angle;
      if (cornerX === "right" && cornerY === "top") adjustedAngle = Math.PI/2 + angle;
      if (cornerX === "right" && cornerY === "bottom") adjustedAngle = Math.PI + angle;
      if (cornerX === "left" && cornerY === "bottom") adjustedAngle = (3*Math.PI)/2 + angle;

      const distance = Math.random() * 250 + 50;
      const x = Math.cos(adjustedAngle) * distance + "px";
      const y = Math.sin(adjustedAngle) * distance + "px";

      confetti.style.setProperty("--x", x);
      confetti.style.setProperty("--y", y);

      setTimeout(() => confetti.remove(), 1500);
    }
  }

  function boomCorners() {
    launchConfettiFromCorner("left", "top");
    launchConfettiFromCorner("right", "top");
    launchConfettiFromCorner("left", "bottom");
    launchConfettiFromCorner("right", "bottom");
  }

  // lancer automatiquement au chargement
  window.addEventListener("load", boomCorners);

  function showPopupAmelioration(oldNote, newNote, mark) {
  const popup = document.createElement("div");
  popup.className = "popup-amelioration";
  if(mark==="true"){
    popup.innerHTML = `<p>Bravo ! Ta note est passée de <b>${oldNote}/20</b> à <b>${newNote}/20</b> </p>`;
  }else{
popup.innerHTML = `<p>Bravo ! Tu avances Très Bien </p>`;
 
  }
 document.body.appendChild(popup);

  // auto-disparition
  setTimeout(() => {
    popup.remove();
  }, 3000);
}