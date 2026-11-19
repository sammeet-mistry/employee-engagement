const test = require('node:test');
const assert = require('node:assert/strict');
const { getResetConfig } = require('../reset-password');

test('reset config requires an explicit database URI, admin email, and strong password', () => {
  assert.throws(() => getResetConfig({}), /MONGODB_URI is not configured/);
  assert.throws(() => getResetConfig({
    MONGODB_URI: 'mongodb://localhost/test'
  }), /RESET_ADMIN_EMAIL is required/);
  assert.throws(() => getResetConfig({
    MONGODB_URI: 'mongodb://localhost/test',
    RESET_ADMIN_EMAIL: 'admin@company.com',
    RESET_ADMIN_PASSWORD: 'short'
  }), /at least 12 characters/);
});

test('reset config normalizes the email without changing the password', () => {
  assert.deepEqual(getResetConfig({
    MONGODB_URI: 'mongodb://localhost/test',
    RESET_ADMIN_EMAIL: '  ADMIN@COMPANY.COM ',
    RESET_ADMIN_PASSWORD: '  correct horse battery  '
  }), {
    mongoUri: 'mongodb://localhost/test',
    email: 'admin@company.com',
    password: '  correct horse battery  '
  });
});
