const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const getResetConfig = (env) => {
  const email = env.RESET_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.RESET_ADMIN_PASSWORD;

  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured.');
  }
  if (!email) {
    throw new Error('RESET_ADMIN_EMAIL is required.');
  }
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('RESET_ADMIN_PASSWORD must be at least 12 characters long.');
  }

  return { mongoUri: env.MONGODB_URI, email, password };
};

const resetPassword = async (env = process.env) => {
  const { mongoUri, email, password } = getResetConfig(env);

  try {
    await mongoose.connect(mongoUri);
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      throw new Error(`No administrator account exists for ${email}.`);
    }

    user.password = password;
    await user.save();
    console.log('Administrator password reset successfully.');
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  resetPassword().catch((error) => {
    console.error('Unable to reset administrator password:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { getResetConfig, resetPassword };
