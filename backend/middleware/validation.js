const { body, validationResult } = require("express-validator");

// Validation pour création/modification de site
const validateWebsite = [
  body("name")
    .isLength({ min: 1, max: 255 })
    .trim()
    .withMessage("Le nom doit contenir entre 1 et 255 caractères"),

  body("url")
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("URL invalide (doit inclure http:// ou https://)"),

  body("client_name")
    .optional()
    .isLength({ max: 255 })
    .trim()
    .withMessage("Le nom du client ne peut dépasser 255 caractères"),

  body("check_interval")
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage("L'intervalle doit être entre 60 et 86400 secondes"),

  body("timeout_threshold")
    .optional()
    .isInt({ min: 1000, max: 120000 })
    .withMessage("Le timeout doit être entre 1000 et 120000 millisecondes"),

  body("ssl_check")
    .optional()
    .isBoolean()
    .withMessage("ssl_check doit être un booléen"),
];

// Validation pour authentification
const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Email invalide"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
];

// Middleware pour traiter les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  validateWebsite,
  validateLogin,
  handleValidationErrors,
};
