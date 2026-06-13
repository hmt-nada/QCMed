// ═══════════════════════════════════════════════════════════════════
// État global
// ═══════════════════════════════════════════════════════════════════
let currentUser = {
  nom: '',
  prenom: '',
  pseudo: '',
  faculte: '',
  avatar: ''
};

let fieldsWithErrors = {
  nom: false,
  prenom: false,
  pseudo: false,
  faculte: false
};

// ═══════════════════════════════════════════════════════════════════
// Validation des champs
// ═══════════════════════════════════════════════════════════════════
const fieldsToValidate = document.querySelectorAll('.nonvide');

fieldsToValidate.forEach(field => {
  // Afficher/masquer classe 'valide' au fur et à mesure
  field.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
      this.classList.add('valide');
    } else {
      this.classList.remove('valide');
    }
    // Réinitialiser la bordure rouge si l'utilisateur corrige
    if (fieldsWithErrors[this.id]) {
      this.style.borderColor = '';
      fieldsWithErrors[this.id] = false;
    }
  });

  // Ajouter classe 'valide' au blur si rempli
  field.addEventListener('blur', function() {
    if (this.value.trim().length > 0) {
      this.classList.add('valide');
    }
  });
});


// ═══════════════════════════════════════════════════════════════════
// Gestion du sélecteur d'avatar
// ═══════════════════════════════════════════════════════════════════
const plus = document.getElementById('plus');
const palette = document.getElementById('palette');
const avatars = document.querySelectorAll('.pdp');
const userAvatar = document.getElementById('user');

if (plus && palette) {
  plus.addEventListener('click', () => {
    palette.style.display = palette.style.display === 'block' ? 'none' : 'block';
  });
}

// Fermer palette quand on clique ailleurs
document.addEventListener('click', function(event) {
  if (palette && palette.style.display === 'block') {
    if (!palette.contains(event.target) && event.target !== plus) {
      palette.style.display = 'none';
    }
  }
});

// Sélection d'avatar
avatars.forEach(avatar => {
  avatar.addEventListener('click', () => {
    const selectedAvatarSrc = avatar.getAttribute('src');
    
    if (currentUser.avatar !== selectedAvatarSrc) {
      userAvatar.setAttribute('src', selectedAvatarSrc);
      userAvatar.classList.add('profil');
      plus.classList.add('plusposition');
      
      avatars.forEach(a => a.classList.remove('selected-avatar'));
      avatar.classList.add('selected-avatar');
      
      currentUser.avatar = selectedAvatarSrc;
    } else {
      userAvatar.setAttribute('src', 'images/user.svg');
      userAvatar.classList.remove('profil');
      avatar.classList.remove('selected-avatar');
      plus.classList.remove('plusposition');
      
      currentUser.avatar = 'images/user.svg';
    }
    
    palette.style.display = 'none';
  });
});


// ═══════════════════════════════════════════════════════════════════
// Charger les données utilisateur au démarrage
// ═══════════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Charger les données de l'utilisateur
    const response = await fetch('/api/mon-compte', { credentials: 'include' });
    const result = await response.json();

    if (result.success && result.utilisateur) {
      const user = result.utilisateur;
      
      // Mettre à jour l'état global
      currentUser = {
        nom: user.nom || '',
        prenom: user.prenom || '',
        pseudo: user.pseudo || '',
        faculte: user.faculte || '',
        avatar: user.avatar || 'images/user.svg'
      };

      // Remplir les champs du formulaire
      document.getElementById('user').src = currentUser.avatar;
      document.getElementById('nom').value = currentUser.nom;
      document.getElementById('prenom').value = currentUser.prenom;
      document.getElementById('pseudo2').value = currentUser.pseudo;
      document.getElementById('faculte').value = currentUser.faculte;

      // Ajouter la classe 'valide' pour les champs non-vides
      fieldsToValidate.forEach(field => {
        if (field.value.trim().length > 0) {
          field.classList.add('valide');
        }
      });

      // Afficher toast si modification précédente
      if (sessionStorage.getItem('profilchange') === 'true') {
        showToast();
        sessionStorage.removeItem('profilchange');
      }

    } else {
      console.error('Erreur : données utilisateur non trouvées');
    }
  } catch (err) {
    console.error('Erreur lors du chargement des données :', err);
  }
});

// ═══════════════════════════════════════════════════════════════════
// Toast de succès
// ═══════════════════════════════════════════════════════════════════
function showToast() {
  const toast = document.getElementById('alert_erreur');
  toast.classList.remove('visible');
  void toast.offsetWidth; // Forcer le recalcul CSS
  toast.classList.add('visible');
  
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2000);
}

// ═══════════════════════════════════════════════════════════════════
// Validation et soumission du formulaire
// ═══════════════════════════════════════════════════════════════════
const saveButton = document.getElementById('button');

function validateForm() {
  fieldsWithErrors = {
    nom: false,
    prenom: false,
    pseudo: false,
    faculte: false
  };

  let hasErrors = false;

  const fieldsToCheck = {
    nom: document.getElementById('nom'),
    prenom: document.getElementById('prenom'),
    pseudo: document.getElementById('pseudo2'),
    faculte: document.getElementById('faculte')
  };

  Object.entries(fieldsToCheck).forEach(([fieldName, fieldElement]) => {
    if (fieldElement.value.trim() === '') {
      fieldElement.style.borderColor = 'red';
      fieldsWithErrors[fieldName] = true;
      hasErrors = true;
    } else {
      fieldElement.style.borderColor = '';
      fieldsWithErrors[fieldName] = false;
    }
  });

  return !hasErrors;
}

saveButton.addEventListener('click', async function(event) {
  event.preventDefault();

  // Valider le formulaire
  if (!validateForm()) {
    return;
  }

  // Préparer les données
  const data = {
    nom: document.getElementById('nom').value.trim(),
    prenom: document.getElementById('prenom').value.trim(),
    pseudo: document.getElementById('pseudo2').value.trim(),
    faculte: document.getElementById('faculte').value.trim(),
    avatar: currentUser.avatar
  };

  try {
    const response = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      // Mettre à jour l'état global
      currentUser = data;
      
      // Afficher toast et recharger
      sessionStorage.setItem('profilchange', 'true');
      location.reload();
    } else {
      alert('Erreur : ' + (result.message || 'Une erreur est survenue'));
    }
  } catch (err) {
    console.error('Erreur lors de la sauvegarde :', err);
    alert('Impossible de contacter le serveur');
  }
});