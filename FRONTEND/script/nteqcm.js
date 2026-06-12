let currentNote = null;
let correctionMode = null;
let fullmark = false;

function remarkqcm(score) {
  if (score <= 4) return "Travail insuffisant, une révision approfondie est nécessaire.";
  if (score <= 8) return "Travail insuffisant, trop d’erreurs persistent.";
  if (score <= 11) return "Travail moyen, des points restent approximatifs.";
  if (score <= 14) return "Travail satisfaisant, à consolider.";
  if (score <= 17) return "Travail très satisfaisant, quelques détails à améliorer.";
  return "Excellent travail, une parfaite maîtrise du sujet.";
}

document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch(`/api/get-note`);
    const data = await res.json();

    if (data.note !== null) {
        currentNote = data.note;
        correctionMode = data.correction || false;

        if (data.full && data.full.length) {
            fullmark = data.full.every(q => q.isCorrect === true);
        }

        const noteElement = document.getElementById("lanote");
        const remarkElement = document.getElementById("remark");
        const remarkElement2 = document.getElementById("remark2");
        const noteDisplay = document.getElementById("note");
         
        if (correctionMode) {
            noteDisplay.style.display = 'block';         
            noteElement.textContent = `Votre note (${correctionMode}) :`;            
            noteDisplay.textContent = `${currentNote} / 20`;
            remarkElement2.textContent = `Évaluation :`;
            remarkElement.textContent = remarkqcm(currentNote);
        } else {
            noteDisplay.style.display = 'none';
            noteElement.textContent = "Résultat du QCM";
            remarkElement2.textContent = `Évaluation de ton travail :`;
            remarkElement.textContent = remarkqcm(currentNote);
        }

        const oldNoteData = sessionStorage.getItem("noteAvant");
        if (oldNoteData) {
            const oldNote = JSON.parse(oldNoteData).note;
            if (currentNote > oldNote) {
                showPopupAmelioration(oldNote, currentNote, correctionMode ? "true" : "false");
            }
            sessionStorage.removeItem("noteAvant");
        }
    }
});

// POPUPS ACTIONS
const popup = document.getElementById("popup");
const btnCorrige = document.getElementById("btnCorrige");
const btnAll = document.getElementById("corrigeAll");
const btnFalse = document.getElementById("corrigeFalse");
const btnCancel = document.getElementById("cancel");
const btnrefais = document.getElementById("btnrefais");

btnCorrige.addEventListener("click", () => popup.style.display = "flex");
btnCancel.addEventListener("click", () => popup.style.display = "none");

btnAll.addEventListener("click", () => {
    popup.style.display = "none";
    window.location.href = "corrigetous.html?mode=tous";
});

btnFalse.addEventListener("click", () => {
    popup.style.display = "none";
    if (fullmark) {
        alert("Bravo ! Tout est déjà correct ✨");
    } else {
        window.location.href = "corrigetous.html?mode=faux";
    }
});

btnrefais.addEventListener("click", () => {
    if (fullmark) {
        alert("Parfait ! Vous avez obtenu la note maximale 🎉");
    } else {
        if (currentNote !== null) {
            sessionStorage.setItem("noteAvant", JSON.stringify({ note: currentNote }));
        }
        window.location.href = "qcm.html?mode=retry";
    }
});

function showPopupAmelioration(oldNote, newNote, mark) {
    const popupDiv = document.createElement("div");
    popupDiv.style.position = "fixed";
    popupDiv.style.bottom = "20px";
    popupDiv.style.left = "50%";
    popupDiv.style.transform = "translateX(-50%)";
    popupDiv.style.background = "#2e7d32";
    popupDiv.style.color = "white";
    popupDiv.style.padding = "10px 20px";
    popupDiv.style.borderRadius = "8px";
    popupDiv.style.fontSize = "0.9rem";
    popupDiv.style.zIndex = "2000";
    
    if (mark === "true") {
        popupDiv.innerHTML = `Progression ! Ta note est passée de <b>${oldNote}/20</b> à <b>${newNote}/20</b> 🚀`;
    } else {
        popupDiv.innerHTML = `Bravo ! Tu avances très bien 🚀`;
    }
    document.body.appendChild(popupDiv);
    setTimeout(() => popupDiv.remove(), 3500);
}