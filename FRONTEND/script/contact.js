/* ============================================================
   contact.js — QCMed
   Validation + envoi via fetch /api/contact-mail
   ============================================================ */

// ---------- Champs non vides (nom, message) ----------
const rempli = document.getElementsByClassName('nonvide');

for (let i = 0; i < rempli.length; i++) {
    rempli[i].addEventListener('input', function () {
        if (this.value.length > 0) {
            this.classList.add('valide');
        } else {
            this.classList.remove('valide');
        }
    });
}

// ---------- Validation email ----------
const email        = document.getElementById('email');
const emailerror   = document.getElementById('mailinvalide');
const titrenormal  = document.getElementById('titrenormal');
let mailblur    = false;
let mailinvalide = false;

function verifierEmail(val) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
}

email.addEventListener('input', () => {
    const val = email.value;

    if (val === '') {
        email.style.borderColor = '';
        email.classList.remove('valide', 'erreur');
        emailerror.style.display  = 'none';
        titrenormal.style.display = 'block';
        return;
    }

    if (mailblur) {
        if (verifierEmail(val)) {
            mailinvalide = false;
            email.classList.add('valide');
            email.classList.remove('erreur');
            emailerror.style.display  = 'none';
            titrenormal.style.display = 'block';
        } else {
            mailinvalide = true;
            email.classList.add('erreur');
            email.classList.remove('valide');
            emailerror.style.display  = 'block';
            titrenormal.style.display = 'none';
        }
    }
});

email.addEventListener('blur', () => {
    mailblur = true;
    const val = email.value;

    if (val === '') {
        email.classList.remove('valide', 'erreur');
        emailerror.style.display  = 'none';
        titrenormal.style.display = 'block';
        return;
    }

    if (verifierEmail(val)) {
        mailinvalide = false;
        email.classList.add('valide');
        email.classList.remove('erreur');
        emailerror.style.display  = 'none';
        titrenormal.style.display = 'block';
    } else {
        mailinvalide = true;
        email.classList.add('erreur');
        email.classList.remove('valide');
        emailerror.style.display  = 'block';
        titrenormal.style.display = 'none';
    }
});

// ---------- Toasts ----------
function showToast(id, duration) {
    const el = document.getElementById(id);
    el.classList.remove('visible');
    void el.offsetWidth; // force reflow pour relancer l'animation si besoin
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), duration || 2500);
}

// ---------- Soumission ----------
const boutton = document.getElementById('boutton');
const nom     = document.getElementById('nom');
const message = document.getElementById('message2');
const form    = document.getElementById('form');

boutton.addEventListener('click', function (event) {
    event.preventDefault();

    let erreur    = false;
    let nameErr   = false;
    let mailErr   = false;
    let mssgErr   = false;

    // Vérification nom
    if (nom.value.trim() === '') {
        erreur = true;
        nameErr = true;
        nom.classList.add('erreur');
    }

    // Vérification message
    if (message.value.trim() === '') {
        erreur = true;
        mssgErr = true;
        message.classList.add('erreur');
    }

    // Vérification email
    if (email.value.trim() === '' || mailinvalide) {
        erreur = true;
        mailErr = true;
        email.classList.add('erreur');
    }

    if (erreur) {
        showToast('alert', 2500);
        return;
    }

    // ----- Envoi -----
    const nomVal     = nom.value.trim();
    const emailVal   = email.value.trim();
    const messageVal = message.value.trim();

    fetch('/api/contact-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomVal, email: emailVal, message: messageVal })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast('alert_erreur', 2500);
                form.reset();
                // Nettoyer les classes de validation
                nom.classList.remove('valide', 'erreur');
                email.classList.remove('valide', 'erreur');
                message.classList.remove('valide', 'erreur');
                mailinvalide = false;
                mailblur     = false;
                emailerror.style.display  = 'none';
                titrenormal.style.display = 'block';
                setTimeout(() => { window.location.href = 'accueil.html'; }, 2600);
            } else {
                showToast('alert', 2500);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('alert', 2500);
        });

    // ----- Réinitialisation des bordures rouges à la prochaine frappe -----
    if (nameErr) {
        nom.addEventListener('input', function handler() {
            nom.classList.remove('erreur');
            nom.removeEventListener('input', handler);
        });
    }

    if (mssgErr) {
        message.addEventListener('input', function handler() {
            message.classList.remove('erreur');
            message.removeEventListener('input', handler);
        });
    }

    if (mailErr) {
        email.addEventListener('input', function handler() {
            email.classList.remove('erreur');
            email.removeEventListener('input', handler);
        });
    }
});

// ---------- Effet bouton gooey (conservé si utilisé ailleurs) ----------
const gooeyBtn = document.querySelector('.c-button--gooey');
if (gooeyBtn) {
    gooeyBtn.addEventListener('click', () => {
        gooeyBtn.classList.add('clicked');
        setTimeout(() => gooeyBtn.classList.remove('clicked'), 200);
    });
}