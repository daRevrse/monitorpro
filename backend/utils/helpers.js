// ========================================
// backend/utils/helpers.js
// ========================================

/**
 * Utilitaires généraux pour MonitorPro
 */

// Validation d'URL
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return ["http:", "https:"].includes(url.protocol);
  } catch (_) {
    return false;
  }
};

// Validation d'email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Formatage de la durée
const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// Formatage des octets
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Génération d'ID aléatoire
const generateId = (length = 8) => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Delay/Sleep utilitaire
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry avec backoff exponentiel
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
};

// Sanitisation des entrées utilisateur
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Supprimer les balises HTML basiques
    .substring(0, 1000); // Limiter la longueur
};

// Calcul de l'uptime en pourcentage
const calculateUptime = (totalChecks, upChecks) => {
  if (totalChecks === 0) return 100;
  return parseFloat(((upChecks / totalChecks) * 100).toFixed(2));
};

// Groupement de données par période
const groupByTimePeriod = (data, periodMinutes = 60) => {
  const groups = {};

  data.forEach((item) => {
    const date = new Date(item.timestamp || item.checked_at || item.created_at);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.floor(minutes / periodMinutes) * periodMinutes;

    date.setMinutes(roundedMinutes, 0, 0);
    const key = date.toISOString();

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  return groups;
};

// Validation des données de monitoring
const validateMonitoringData = {
  url: (url) => {
    if (!url || typeof url !== "string") return "URL requise";
    if (!isValidUrl(url)) return "URL invalide";
    if (url.length > 500) return "URL trop longue";
    return null;
  },

  interval: (interval) => {
    const num = parseInt(interval);
    if (isNaN(num)) return "Intervalle doit être un nombre";
    if (num < 60) return "Intervalle minimum: 60 secondes";
    if (num > 86400) return "Intervalle maximum: 24 heures";
    return null;
  },

  timeout: (timeout) => {
    const num = parseInt(timeout);
    if (isNaN(num)) return "Timeout doit être un nombre";
    if (num < 1000) return "Timeout minimum: 1 seconde";
    if (num > 120000) return "Timeout maximum: 2 minutes";
    return null;
  },
};

// Hash sécurisé pour les mots de passe
const hashPassword = async (password) => {
  const bcrypt = require("bcrypt");
  return await bcrypt.hash(password, 12);
};

// Vérification de mot de passe
const verifyPassword = async (password, hash) => {
  const bcrypt = require("bcrypt");
  return await bcrypt.compare(password, hash);
};

// Génération de token sécurisé
const generateSecureToken = (length = 32) => {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
};

// Nettoyage des données sensibles pour les logs
const sanitizeForLogs = (obj) => {
  const sensitiveFields = [
    "password",
    "password_hash",
    "token",
    "secret",
    "key",
  ];
  const cleaned = { ...obj };

  Object.keys(cleaned).forEach((key) => {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      cleaned[key] = "***";
    }
  });

  return cleaned;
};

// Export de tous les utilitaires
module.exports = {
  isValidUrl,
  isValidEmail,
  formatDuration,
  formatBytes,
  generateId,
  sleep,
  retryWithBackoff,
  sanitizeInput,
  calculateUptime,
  groupByTimePeriod,
  validateMonitoringData,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  sanitizeForLogs,
};
