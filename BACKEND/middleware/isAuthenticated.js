const isApiRequest = (req) => {
  const path = req.originalUrl || req.path || '';
  if (path.startsWith('/api')) return true;
  const accept = (req.get('accept') || '');
  if (accept.indexOf('application/json') !== -1) return true;
  if (req.xhr) return true;
  return false;
};

const isAuthenticated = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }

  if (isApiRequest(req)) {
    return res.status(401).json({ success: false, message: 'Non authentifié.' });
  }

  return res.redirect('/connexion.html');
};

module.exports = isAuthenticated;
