// ========================================
// backend/config/monitoring.js
// ========================================
module.exports = {
  defaultCheckInterval: parseInt(process.env.DEFAULT_CHECK_INTERVAL) || 300, // 5 minutes
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT) || 10000, // 10 secondes
  maxConcurrentChecks: parseInt(process.env.MAX_CONCURRENT_CHECKS) || 50,
  retryAttempts: 3,
  retryDelay: 5000, // 5 secondes

  alerting: {
    cooldownPeriod: parseInt(process.env.COOLDOWN_PERIOD) || 600000, // 10 minutes
    maxQueueSize: 1000,
    processingDelay: 1000, // 1 seconde entre alertes
  },

  ssl: {
    warningDays: 30, // Alerte SSL si expire dans moins de 30 jours
    checkTimeout: 5000,
  },

  cleanup: {
    checksRetentionDays: 30,
    archiveRetentionDays: 90,
    incidentAutoCloseDays: 7,
  },
};
