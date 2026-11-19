const User = require("../models/User");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require("express-validator");

const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department
});

const startSession = (req, user) => new Promise((resolve, reject) => {
  req.session.regenerate((error) => {
    if (error) return reject(error);
    req.session.user = { id: user._id.toString() };
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
  });
});

exports.getCsrfToken = (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.json({ csrfToken: req.session.csrfToken });
};

exports.getSocketToken = (req, res) => {
  if (!process.env.SOCKET_TOKEN_SECRET) {
    return res.status(503).json({ message: 'Realtime authentication is not configured.' });
  }

  const token = jwt.sign(
    { sub: req.user.id, role: req.user.role, purpose: 'socket' },
    process.env.SOCKET_TOKEN_SECRET,
    { algorithm: 'HS256', expiresIn: '60s', issuer: 'employee-engagement' }
  );
  res.json({ token });
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, email, password, department } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      role: "employee",
      department
    });
    await user.save();

    await startSession(req, user);
    res.status(201).json({ user: getSafeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await startSession(req, user);
    res.json({ user: getSafeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = (req, res) => {
  const io = req.app.get('io');
  if (io) io.in(`user:${req.user.id}`).disconnectSockets(true);

  req.session.destroy((error) => {
    if (error) {
      console.error('Unable to destroy session:', error);
      return res.status(500).json({ message: 'Unable to sign out right now.' });
    }

    res.clearCookie('employee.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.json({ message: 'Signed out successfully.' });
  });
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
