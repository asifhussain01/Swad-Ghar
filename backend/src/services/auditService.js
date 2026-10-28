const AuditLog = require('../models/AuditLog');

const logAuditAction = async ({
  performedBy,
  role,
  action,
  entityType,
  entityId,
  previousState = null,
  newState = null,
  details = '',
  ipAddress = '',
}) => {
  try {
    const log = await AuditLog.create({
      performedBy,
      role,
      action,
      entityType,
      entityId,
      previousState,
      newState,
      details,
      ipAddress,
    });
    return log;
  } catch (error) {
    console.error('[AuditService Error]:', error.message);
    return null;
  }
};

module.exports = { logAuditAction };
