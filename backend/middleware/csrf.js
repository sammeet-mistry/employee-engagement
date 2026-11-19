const crypto = require('crypto');

const createCsrfProtection = (allowedOrigins) => (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const origin = req.get('Origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'Request origin is not allowed.' });
  }

  const token = req.get('X-CSRF-Token');
  const expectedToken = req.session?.csrfToken;
  if (
    typeof token !== 'string'
    || typeof expectedToken !== 'string'
    || token.length !== expectedToken.length
    || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
  ) {
    return res.status(403).json({ message: 'CSRF validation failed. Refresh the page and try again.' });
  }

  return next();
};

module.exports = { createCsrfProtection };
