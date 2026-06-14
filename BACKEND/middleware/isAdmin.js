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
  const user = req.session?.user;
  if (!user) {
    if (isApiRequest(req)) return res.status(401).json({ success: false, message: 'Non authentifié.' });
    return res.redirect('/connexion.html');
  }

  const role = (user.role || '').toLowerCase();
  const email = (user.email || '').trim().toLowerCase();

  if (role === 'admin' || ADMIN_EMAILS.includes(email)) {
    return next();
  }

  if (isApiRequest(req)) return res.status(403).json({ success: false, message: 'Accès refusé.' });
  return res.redirect('/accueil.html');

  return next();
};
module.exports = isAdmin;