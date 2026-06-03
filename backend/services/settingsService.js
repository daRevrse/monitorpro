// backend/services/settingsService.js
// Charge et met en cache la configuration applicative (table app_settings, ligne 1).
const { Settings } = require("../models");
const logger = require("../utils/logger");

let cache = null;

const defaults = () => ({
  id: 1,
  smtp_host: process.env.SMTP_HOST || null,
  smtp_port: parseInt(process.env.SMTP_PORT) || 587,
  smtp_secure: process.env.SMTP_SECURE === "true",
  smtp_user: process.env.SMTP_USER || null,
  smtp_pass: process.env.SMTP_PASS || null,
  smtp_from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
  slack_webhook_url: process.env.SLACK_WEBHOOK_URL || null,
  alert_cooldown: parseInt(process.env.COOLDOWN_PERIOD) || 600000,
  default_check_interval: parseInt(process.env.DEFAULT_CHECK_INTERVAL) || 300,
  default_timeout: parseInt(process.env.DEFAULT_TIMEOUT) || 10000,
  default_ssl_check: true,
});

// Charge depuis la base, crée la ligne si absente
async function load() {
  try {
    let row = await Settings.findByPk(1);
    if (!row) {
      row = await Settings.create({ id: 1, ...defaults() });
    }
    cache = row.toJSON();
  } catch (error) {
    logger.error("Erreur chargement settings, fallback .env:", error.message);
    cache = defaults();
  }
  return cache;
}

// Accès synchrone au cache (charge les défauts si pas encore chargé)
function get() {
  return cache || defaults();
}

async function refresh() {
  return load();
}

module.exports = { load, get, refresh, defaults };
