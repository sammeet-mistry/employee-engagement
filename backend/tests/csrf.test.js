const test = require('node:test');
const assert = require('node:assert/strict');
const { createCsrfProtection } = require('../middleware/csrf');

const invoke = (request, allowedOrigins = ['https://portal.example']) => new Promise((resolve) => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      resolve({ status: this.statusCode, body: this.body });
    }
  };
  const req = {
    method: 'POST',
    session: { csrfToken: 'expected-token' },
    get(name) {
      return request.headers[name.toLowerCase()];
    },
    ...request
  };

  createCsrfProtection(allowedOrigins)(req, response, () => resolve({ status: 200 }));
});

test('CSRF middleware allows matching session token and approved origin', async () => {
  const result = await invoke({
    headers: {
      origin: 'https://portal.example',
      'x-csrf-token': 'expected-token'
    }
  });
  assert.equal(result.status, 200);
});

test('CSRF middleware rejects a mismatched token', async () => {
  const result = await invoke({
    headers: {
      origin: 'https://portal.example',
      'x-csrf-token': 'wrong-token'
    }
  });
  assert.equal(result.status, 403);
});

test('CSRF middleware rejects unapproved request origins', async () => {
  const result = await invoke({
    headers: {
      origin: 'https://attacker.example',
      'x-csrf-token': 'expected-token'
    }
  });
  assert.equal(result.status, 403);
});

test('CSRF middleware does not require a token for safe requests', async () => {
  const result = await invoke({ method: 'GET', headers: {} });
  assert.equal(result.status, 200);
});
