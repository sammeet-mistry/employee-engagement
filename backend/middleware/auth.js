const User = require('../models/User');

const auth = async (req, res, next) => {
  const sessionUserId = req.session?.user?.id;
  if (!sessionUserId) {
    return res.status(401).json({ message: 'Sign in to continue.' });
  }

  try {
    const user = await User.findById(sessionUserId).select('role');
    if (!user) return res.status(401).json({ message: 'Sign in to continue.' });

    req.user = { id: user._id.toString(), role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = { auth, adminOnly };