const AuditLog = require('../models/AuditLog');

const recordAudit = async (req, { action, resourceType, resourceId, details = {} }) => {
  const entry = await AuditLog.create({
    actor: req.user.id,
    action,
    resourceType,
    resourceId: resourceId?.toString(),
    details
  });

  const io = req.app.get('io');
  if (io) io.to('admins').emit('audit:created', { auditId: entry._id });
  return entry;
};

module.exports = { recordAudit };
