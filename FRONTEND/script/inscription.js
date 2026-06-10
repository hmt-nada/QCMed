// ─── Éléments DOM ─────────────────────────────────────
const nom         = document.getElementById('nom');
const prenom      = document.getElementById('prenom');
const faculte     = document.getElementById('faculte');
const autreFaculte= document.getElementById('autreFaculte');
const annee       = document.getElementById('annee');
const email       = document.getElementById('mailvalide');
const password    = document.getElementById('password1');
const confirmation= document.getElementById('password2');
const boutton     = document.getElementById('boutton');
const alertbox    = document.getElementById('alert');

// Labels / erreurs
const emailLabel      = document.getElementById('emailLabel');
const emailErreurFormat = document.getElementById('emailErreurFormat');
const emailErreurDeja   = document.getElementById('emailErreurDeja');
const erreurPass      = document.getElementById('erreur');
const erreurConf      = document.getElementById('erreur2');

// Œils
const eyeclose1 = document.getElementById('eyeclose1');
const eyeopen1  = document.getElementById('eyeopen1');
const eyeclose2 = document.getElementById('eyeclose2');
const eyeopen2  = document.getElementById('eyeopen2');

// ─── États de validation ───────────────────────────────
let mailblur    = false;
let mailinvalide = false;
let champDéjàBlur = false;
let passinvalid  = false;
let champblur   = false;
let confinvalid  = false;

// ─── Helpers ──────────────────────────────────────────
function verifierEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function showError(el) {
  el.classList.add('visible');
}
function hideError(el) {
  el.classList.remove('visible');
}
function setFieldError(input, bool) {
  input.style.borderColor = bool ? 'red' : '';
  if (!bool) input.classList.remove('valide');
}

// ─── Champs simples (valide quand non vide) ───────────
['nom', 'prenom'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    if (el.value.length > 0) {
      el.classList.add('valide');
      setFieldError(el, false);
    } else {
      el.classList.remove('valide');
    }
  });
});

// ─── Faculté ──────────────────────────────────────────
faculte.addEventListener('change', () => {
  setFieldError(faculte, false);
  if (faculte.value === 'autre') {
    autreFaculte.style.display = 'block';
    autreFaculte.focus();
  } else {
    autreFaculte.style.display = 'none';
  }
});

autreFaculte.addEventListener('input', () => {
  setFieldError(autreFaculte, false);
});

annee.addEventListener('change', () => {
  setFieldError(annee, false);
});

// ─── Email ────────────────────────────────────────────
email.addEventListener('blur', () => {
  mailblur = true;
  const val = email.value.trim();
  if (!val) {
    setFieldError(email, false);
    email.classList.remove('valide');
    hideError(emailErreurFormat);
  } else if (!verifierEmail(val)) {
    mailinvalide = true;
    setFieldError(email, true);
    showError(emailErreurFormat);
    hideError(emailErreurDeja);
  } else {
    mailinvalide = false;
    setFieldError(email, false);
    email.classList.add('valide');
    hideError(emailErreurFormat);
    hideError(emailErreurDeja);
  }
});

email.addEventListener('input', () => {
  hideError(emailErreurDeja);
  if (!mailblur) return;
  const val = email.value.trim();
  if (!val) {
    setFieldError(email, false);
    email.classList.remove('valide');
    hideError(emailErreurFormat);
  } else if (verifierEmail(val)) {
    mailinvalide = false;
    setFieldError(email, false);
    email.classList.add('valide');
    hideError(emailErreurFormat);
  } else {
    mailinvalide = true;
    setFieldError(email, true);
    showError(emailErreurFormat);
  }
});

// ─── Mot de passe ─────────────────────────────────────
password.addEventListener('blur', () => {
  champDéjàBlur = true;
  const val = password.value;
  if (!val) {
    setFieldError(password, false);
    password.classList.remove('valide');
    hideError(erreurPass);
  } else if (val.length < 6) {
    passinvalid = true;
    setFieldError(password, true);
    showError(erreurPass);
  } else {
    passinvalid = false;
    setFieldError(password, false);
    password.classList.add('valide');
    hideError(erreurPass);
  }
});

password.addEventListener('input', () => {
  if (!champDéjàBlur) return;
  const val = password.value;
  if (!val) {
    setFieldError(password, false);
    password.classList.remove('valide');
    hideError(erreurPass);
  } else if (val.length < 6) {
    passinvalid = true;
    setFieldError(password, true);
    showError(erreurPass);
  } else {
    passinvalid = false;
    setFieldError(password, false);
    password.classList.add('valide');
    hideError(erreurPass);
  }
});

// ─── Confirmation mot de passe ────────────────────────
confirmation.addEventListener('blur', () => {
  champblur = true;
  const val = confirmation.value;
  if (!val) {
    setFieldError(confirmation, false);
    confirmation.classList.remove('valide');
    hideError(erreurConf);
  } else if (val !== password.value) {
    confinvalid = true;
    setFieldError(confirmation, true);
    showError(erreurConf);
  } else {
    confinvalid = false;
    setFieldError(confirmation, false);
    confirmation.classList.add('valide');
    hideError(erreurConf);
  }
});

confirmation.addEventListener('input', () => {
  if (!champblur) return;
  const val = confirmation.value;
  if (!val) {
    setFieldError(confirmation, false);
    confirmation.classList.remove('valide');
    hideError(erreurConf);
  } else if (val !== password.value) {
    confinvalid = true;
    setFieldError(confirmation, true);
    showError(erreurConf);
  } else {
    confinvalid = false;
    setFieldError(confirmation, false);
    confirmation.classList.add('valide');
    hideError(erreurConf);
  }
});

// ─── Œils mot de passe ────────────────────────────────
document.getElementById('eyeToggle1').addEventListener('click', () => {
  const isPassword = password.type === 'password';
  password.type = isPassword ? 'text' : 'password';
  eyeclose1.style.display = isPassword ? 'none' : 'block';
  eyeopen1.style.display  = isPassword ? 'block' : 'none';
});

document.getElementById('eyeToggle2').addEventListener('click', () => {
  const isPassword = confirmation.type === 'password';
  confirmation.type = isPassword ? 'text' : 'password';
  eyeclose2.style.display = isPassword ? 'none' : 'block';
  eyeopen2.style.display  = isPassword ? 'block' : 'none';
});

// ─── Bouton — animation gooey ─────────────────────────
boutton.addEventListener('click', () => {
  boutton.classList.add('clicked');
  setTimeout(() => boutton.classList.remove('clicked'), 200);
});

// ─── Soumission ───────────────────────────────────────
boutton.addEventListener('click', function(event) {
  event.preventDefault();

  let erreur = false;

  if (!nom.value.trim())            { erreur = true; setFieldError(nom, true); }
  if (!prenom.value.trim())         { erreur = true; setFieldError(prenom, true); }
  if (!email.value.trim() || mailinvalide) { erreur = true; setFieldError(email, true); }
  if (!password.value.trim() || passinvalid) { erreur = true; setFieldError(password, true); }
  if (!confirmation.value.trim() || confinvalid) { erreur = true; setFieldError(confirmation, true); }

  if (faculte.value === '') {
    erreur = true;
    setFieldError(faculte, true);
  }
  if (faculte.value === 'autre' && !autreFaculte.value.trim()) {
    erreur = true;
    setFieldError(autreFaculte, true);
  }
  if (annee.value === '') {
    erreur = true;
    setFieldError(annee, true);
  }

  if (erreur) {
    alertbox.classList.remove('visible');
    void alertbox.offsetWidth;
    alertbox.classList.add('visible');
    setTimeout(() => alertbox.classList.remove('visible'), 2500);
    return;
  }

  // ─── Envoi au backend ──────────────────────────────
  const data = {
    nom:      nom.value.trim(),
    prenom:   prenom.value.trim(),
    faculte:  faculte.value === 'autre' ? autreFaculte.value.trim() : faculte.value,
    annee:    annee.value.trim(),
    email:    email.value.trim(),
    password: password.value.trim(),
  };

  fetch('/api/inscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
    .then(r => r.json())
    .then(result => {
      if (result.success) {
        sessionStorage.setItem('emailInscrit', email.value.trim());
        window.location.href = 'pseudo.html';
      } else {
        // Email déjà utilisé
        setFieldError(email, true);
        showError(emailErreurDeja);
        hideError(emailErreurFormat);
        document.getElementById('login').classList.add('zoom');
        setTimeout(() => document.getElementById('login').classList.remove('zoom'), 2000);
      }
    })
    .catch(err => {
      console.error('Erreur lors de l\'envoi :', err);
      alert('Impossible de contacter le serveur.');
    });
});

// ─── Animation titre ──────────────────────────────────
window.addEventListener('load', () => {
  const titre = document.getElementById('inscrivez');
  if (titre) {
    setTimeout(() => titre.classList.add('visible'), 100);
  }
});

// ─── Navigation clavier (Enter → champ suivant) ───────
const inputs = document.querySelectorAll('.field');
inputs.forEach((input, index) => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.value.length > 0 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      } else {
        input.blur();
      }
    }
    if (e.key === 'Backspace' && input.value === '' && index > 0) {
      inputs[index - 1].focus();
    }
  });
});