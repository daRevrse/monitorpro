const rateLimit = require("express-rate-limit");

// Rate limiting général pour l'API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP par fenêtre
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting pour les routes internes
    return req.path.startsWith("/api/monitoring/internal");
  },
});

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par IP
  message: {
    success: false,
    message: "Trop de tentatives de connexion, veuillez réessayer plus tard.",
  },
  skipSuccessfulRequests: true, // Ne pas compter les tentatives réussies
});

// Rate limiting pour les actions sensibles
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 actions par heure
  message: {
    success: false,
    message: "Limite d'actions atteinte, veuillez réessayer plus tard.",
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  strictLimiter,
};
