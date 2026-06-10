// navbar.js
fetch('navbar.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('navbar-container').innerHTML = html;

    // Active le bon lien selon la page
    const page = window.CURRENT_PAGE || '';
    document.querySelectorAll('.nav-link[data-nav="' + page + '"]')
      .forEach(el => el.classList.add('active'));

    // Dropdown profil
    const profileBtn = document.getElementById('navProfileBtn');
    const dropdown   = document.getElementById('navDropdown');
    profileBtn?.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown?.classList.remove('open'));

    // Fetch utilisateur → avatar + pseudo
    fetch('/api/utilisateur', { method: 'GET', credentials: 'include' })
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          const user = result.utilisateur;
          const avatarImg  = document.getElementById('navAvatarImg');
          const usernameEl = document.getElementById('navUsername');
          if (avatarImg)  avatarImg.src         = user.avatar;
          if (usernameEl) usernameEl.textContent = user.pseudo;
          const event = new CustomEvent('utilisateurCharge', { detail: result.utilisateur });
document.dispatchEvent(event);
window._utilisateurChargeData = result.utilisateur;
        }
      })
      .catch(err => console.error('Navbar: erreur utilisateur', err));
  })
  .catch(err => console.error('Navbar: erreur chargement html', err));