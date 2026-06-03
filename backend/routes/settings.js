// ========================================
// backend/routes/settings.js
// ========================================
const express = require("express");
const { body, validationResult } = require("express-validator");
const { Settings } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const settingsService = require("../services/settingsService");
const emailService = require("../services/emailService");
const logger = require("../utils/logger");

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole(["admin"]));

// On ne renvoie jamais le mot de passe SMTP, juste s'il est défini
const serialize = (s) => {
  const { smtp_pass, ...rest } = s;
  return { ...rest, smtp_pass_set: !!smtp_pass };
};

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const settings = await settingsService.refresh();
    res.json({ success: true, data: serialize(settings) });
  } catch (error) {
    logger.error("Erreur lecture settings:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la lecture des paramètres",
    });
  }
});

// PUT /api/settings
router.put(
  "/",
  [
    body("smtp_host").optional({ nullable: true }).isLength({ max: 255 }).trim(),
    body("smtp_port").optional({ nullable: true }).isInt({ min: 1, max: 65535 }),
    body("smtp_secure").optional().isBoolean(),
    body("smtp_user").optional({ nullable: true }).isLength({ max: 255 }).trim(),
    body("smtp_pass").optional({ nullable: true }).isLength({ max: 255 }),
    body("smtp_from")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail(),
    body("slack_webhook_url")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),
    body("alert_cooldown").optional().isInt({ min: 0 }),
    body("default_check_interval").optional().isInt({ min: 60, max: 86400 }),
    body("default_timeout").optional().isInt({ min: 1000, max: 120000 }),
    body("default_ssl_check").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const row = await Settings.findByPk(1);
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Paramètres introuvables" });

      const fields = [
        "smtp_host",
        "smtp_port",
        "smtp_secure",
        "smtp_user",
        "smtp_from",
        "slack_webhook_url",
        "alert_cooldown",
        "default_check_interval",
        "default_timeout",
        "default_ssl_check",
      ];
      const updateData = {};
      fields.forEach((f) => {
        if (req.body[f] !== undefined) updateData[f] = req.body[f];
      });
      // Le mot de passe n'est mis à jour que s'il est fourni et non vide
      if (req.body.smtp_pass) updateData.smtp_pass = req.body.smtp_pass;

      await row.update(updateData);

      // Recharger le cache + reconfigurer l'email
      const settings = await settingsService.refresh();
      emailService.configureFromSettings(settings);

      logger.info(`Paramètres mis à jour par ${req.user.email}`);
      res.json({ success: true, message: "Paramètres enregistrés", data: serialize(settings) });
    } catch (error) {
      logger.error("Erreur mise à jour settings:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'enregistrement des paramètres",
      });
    }
  }
);

// POST /api/settings/test-email
router.post(
  "/test-email",
  [body("email").isEmail()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      await emailService.sendTestEmail(req.body.email);
      res.json({
        success: true,
        message: `Email de test envoyé à ${req.body.email}`,
      });
    } catch (error) {
      logger.error("Erreur test email:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Échec de l'envoi de l'email de test",
      });
    }
  }
);

module.exports = router;
