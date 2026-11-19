const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFeedbackQuery = ({ category, priority, status, department, anonymous, assignedTo, search } = {}) => {
  const query = {};

  if (typeof category === 'string' && category.trim()) query.category = category.trim();
  if (typeof priority === 'string' && priority.trim()) query.priority = priority.trim();
  if (typeof status === 'string' && status.trim()) query.status = status.trim();
  if (typeof department === 'string' && department.trim()) query.department = department.trim();
  if (anonymous === 'true' || anonymous === 'false') query.anonymous = anonymous === 'true';
  if (assignedTo === 'unassigned') query.assignedTo = null;
  else if (typeof assignedTo === 'string' && /^[a-f\d]{24}$/i.test(assignedTo)) query.assignedTo = assignedTo;

  if (typeof search === 'string' && search.trim()) {
    const searchPattern = escapeRegex(search.trim());
    query.$or = [
      { title: { $regex: searchPattern, $options: 'i' } },
      { description: { $regex: searchPattern, $options: 'i' } },
      { category: { $regex: searchPattern, $options: 'i' } }
    ];
  }

  return query;
};

const toCsvCell = (value) => {
  let text = value == null
    ? ''
    : value instanceof Date
      ? value.toISOString()
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

  if (/^[\s\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const feedbackCsvColumns = [
  ['Feedback ID', (feedback) => feedback._id],
  ['Submitted At', (feedback) => feedback.createdAt],
  ['Title', (feedback) => feedback.title],
  ['Description', (feedback) => feedback.description],
  ['Category', (feedback) => feedback.category],
  ['Priority', (feedback) => feedback.priority],
  ['Status', (feedback) => feedback.status],
  ['Anonymous', (feedback) => feedback.anonymous],
  ['Department', (feedback) => feedback.department],
  ['Assigned HR', (feedback) => feedback.assignedTo?.name],
  ['Response Due At', (feedback) => feedback.responseDueAt],
  ['Sentiment', (feedback) => feedback.sentiment],
  ['AI Summary', (feedback) => feedback.aiSummary],
  ['Question Answers', (feedback) => feedback.questionAnswers],
  ['Conversation Messages', (feedback) => feedback.messages],
  ['Submitter Name', (feedback) => feedback.anonymous ? 'Anonymous' : feedback.submittedBy?.name],
  ['Submitter Email', (feedback) => feedback.anonymous ? '' : feedback.submittedBy?.email]
];

const createFeedbackCsv = (feedback) => [
  feedbackCsvColumns.map(([header]) => toCsvCell(header)).join(','),
  ...feedback.map((item) => feedbackCsvColumns
    .map(([, getValue]) => toCsvCell(getValue(item)))
    .join(','))
].join('\r\n');

module.exports = { buildFeedbackQuery, createFeedbackCsv };
