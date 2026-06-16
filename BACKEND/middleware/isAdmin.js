const isApiRequest = (req) => {
  const path = req.originalUrl || req.path || '';
  if (path.startsWith('/api')) return true;
  const accept = (req.get('accept') || '');
  if (accept.indexOf('application/json') !== -1) return true;
  if (req.xhr) return true;
  return false;
};

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const isAdmin = (req, res, next) => {
  try {
    const user = req.session?.user;

    if (!user) {
      if (isApiRequest(req)) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié.',
          details: 'La session utilisateur est absente ou expirée.'
        });
      }
      return res.redirect('/connexion.html');
    }

    const isAdminUser = user.isAdmin === true;
    const email = (user.email || '').trim().toLowerCase();

    if (isAdminUser || ADMIN_EMAILS.includes(email)) {
      return next();
    }

    if (isApiRequest(req)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé.',
        details: 'L’utilisateur n’est pas administrateur.'
      });
    }

    return res.redirect('/accueil.html');
  } catch (err) {
    console.error('[isAdmin] unexpected error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur middleware d’authentification.',
      details: err.message,
    });
  }
};

module.exports = isAdmin;