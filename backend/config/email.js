module.exports = {
  smtp: {
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
  templates: {
    alertSubjects: {
      down: "🚨 ALERTE: {siteName} est INACCESSIBLE",
      up: "✅ RÉCUPÉRATION: {siteName} est de nouveau accessible",
      warning: "⚠️ AVERTISSEMENT: {siteName} présente des problèmes",
    },
  },
};
