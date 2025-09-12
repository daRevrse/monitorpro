// backend/utils/logger.js
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Niveaux et couleurs personnalisés
const logLevels = { error: 0, warn: 1, info: 2, debug: 3, success: 4 };
const logColors = {
  error: "red",
  warn: "yellow",
  info: "blue",
  debug: "gray",
  success: "green",
};
winston.addColors(logColors);

// Formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let output = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0)
      output += `\n${JSON.stringify(meta, null, 2)}`;
    return output;
  })
);

// Créer dossier logs si inexistant
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Transports
const transports = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || "info",
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "app.log"),
    level: "debug",
    format: logFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    format: logFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 3,
    tailable: true,
  }),
];

// Logger principal
const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Méthodes personnalisées
logger.success = (message, meta = {}) => logger.log("success", message, meta);

// Middleware Express
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
    };
    if (res.statusCode >= 400) logger.warn("HTTP Request", logData);
    else logger.info("HTTP Request", logData);
  });
  next();
};

// Logger DB
logger.dbError = (error, query = "") => {
  logger.error("Database Error", {
    error: error.message,
    query: query.length > 200 ? query.substring(0, 200) + "..." : query,
    stack: error.stack,
  });
};

// Logger monitoring
logger.monitoring = {
  siteCheck: (siteUrl, status, responseTime, error = null) => {
    logger.debug("Site Check", {
      url: siteUrl,
      status,
      responseTime: responseTime ? `${responseTime}ms` : null,
      error: error ? error.message : null,
    });
  },
  incident: (siteUrl, severity, action, description) => {
    logger.info("Incident", { site: siteUrl, severity, action, description });
  },
  alert: (siteUrl, alertType, recipients) => {
    logger.info("Alert Sent", {
      site: siteUrl,
      type: alertType,
      recipients: recipients.length || recipients,
    });
  },
};

module.exports = logger;
