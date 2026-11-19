const redactAnonymousSubmitter = (feedback) => feedback.map((item) => {
  const record = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  if (record.anonymous) record.submittedBy = null;
  return record;
});

module.exports = { redactAnonymousSubmitter };
