const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePagination, createPagination } = require('../utils/pagination');

test('pagination applies defaults and caps page size', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '500' }), {
    page: 3,
    limit: 100,
    skip: 200
  });
});

test('pagination ignores invalid or non-positive values', () => {
  assert.deepEqual(parsePagination({ page: '-2', limit: '0' }, 10), {
    page: 1,
    limit: 10,
    skip: 0
  });
});

test('pagination metadata represents empty result sets', () => {
  assert.deepEqual(createPagination(1, 25, 0), {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });
});
