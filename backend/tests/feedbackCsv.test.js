const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFeedbackQuery, createFeedbackCsv } = require('../utils/feedbackCsv');
const { redactAnonymousSubmitter } = require('../utils/feedbackPrivacy');

test('feedback export applies dashboard filters and escapes regex search input', () => {
  const query = buildFeedbackQuery({
    category: 'Benefits',
    anonymous: 'true',
    assignedTo: 'unassigned',
    search: 'a.*'
  });

  assert.equal(query.category, 'Benefits');
  assert.equal(query.anonymous, true);
  assert.equal(query.assignedTo, null);
  assert.equal(query.$or[0].title.$regex, 'a\\.\\*');
  assert.equal(query.$or[1].description.$options, 'i');
});

test('CSV escapes quotes and formula-like cell values', () => {
  const csv = createFeedbackCsv([{
    _id: 'feedback-1',
    title: '=HYPERLINK("https://example.invalid")',
    description: 'A line, with "quotes"\nand another line',
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
    anonymous: false,
    submittedBy: { name: 'Employee', email: 'employee@example.invalid' }
  }]);

  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.invalid""\)"/);
  assert.match(csv, /"A line, with ""quotes""\nand another line"/);
  assert.match(csv, /employee@example\.invalid/);
});

test('CSV does not export submitter identity for anonymous feedback', () => {
  const csv = createFeedbackCsv([{
    _id: 'feedback-2',
    anonymous: true,
    submittedBy: { name: 'Private Person', email: 'private@example.invalid' }
  }]);

  assert.match(csv, /"Anonymous",""/);
  assert.doesNotMatch(csv, /Private Person|private@example\.invalid/);
});

test('CSV includes HR assignment and response deadline fields', () => {
  const csv = createFeedbackCsv([{
    assignedTo: { name: 'HR Reviewer' },
    responseDueAt: new Date('2026-01-03T03:04:05.000Z')
  }]);

  assert.match(csv, /"Assigned HR","Response Due At"/);
  assert.match(csv, /"HR Reviewer","2026-01-03T03:04:05\.000Z"/);
});

test('admin feedback records redact the populated submitter for anonymous entries', () => {
  const [anonymous, identified] = redactAnonymousSubmitter([
    { _id: 'feedback-1', anonymous: true, submittedBy: { name: 'Private Person', email: 'private@example.invalid' } },
    { _id: 'feedback-2', anonymous: false, submittedBy: { name: 'Known Person' } }
  ]);

  assert.equal(anonymous.submittedBy, null);
  assert.deepEqual(identified.submittedBy, { name: 'Known Person' });
});
