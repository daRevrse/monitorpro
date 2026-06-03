// ========================================
// backend/routes/hostingAccounts.js
// ========================================
const express = require("express");
const { body, validationResult } = require("express-validator");
const { HostingAccount, Website } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();
router.use(authenticateToken);

const serializeSite = (site) => ({
  id: site.id,
  name: site.name,
  url: site.url,
  status: site.status,
  is_active: site.is_active,
});

const serialize = (account, { withSites = true } = {}) => {
  const sites = account.websites || [];
  return {
    id: account.id,
    name: account.name,
    provider: account.provider,
    login: account.login,
    panel_url: account.panel_url,
    account_email: account.account_email,
    expires_at: account.expires_at,
    notes: account.notes,
    site_count: sites.length,
    sites: withSites ? sites.map(serializeSite) : undefined,
  };
};

const validators = [
  body("name").isLength({ min: 1, max: 255 }).trim(),
  body("provider").optional({ nullable: true }).isLength({ max: 255 }).trim(),
  body("login").optional({ nullable: true }).isLength({ max: 255 }).trim(),
  body("panel_url").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("account_email")
    .optional({ nullable: true, checkFalsy: true })
    .isEmail(),
  body("expires_at").optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body("notes").optional({ nullable: true }).isLength({ max: 5000 }).trim(),
];

// GET /api/hosting-accounts - Liste des comptes + leurs sites
router.get("/", async (req, res) => {
  try {
    const accounts = await HostingAccount.findAll({
      include: [{ model: Website, as: "websites" }],
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: accounts.map((a) => serialize(a)) });
  } catch (error) {
    logger.error("Erreur liste comptes hébergement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des comptes d'hébergement",
    });
  }
});

// GET /api/hosting-accounts/:id
router.get("/:id", async (req, res) => {
  try {
    const account = await HostingAccount.findByPk(req.params.id, {
      include: [{ model: Website, as: "websites" }],
    });
    if (!account)
      return res
        .status(404)
        .json({ success: false, message: "Compte non trouvé" });
    res.json({ success: true, data: serialize(account) });
  } catch (error) {
    logger.error("Erreur détail compte hébergement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du compte",
    });
  }
});

// POST /api/hosting-accounts
router.post(
  "/",
  validators,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const fields = [
        "name",
        "provider",
        "login",
        "panel_url",
        "account_email",
        "expires_at",
        "notes",
      ];
      const payload = {};
      fields.forEach((f) => {
        if (req.body[f] !== undefined) payload[f] = req.body[f] || null;
      });

      const account = await HostingAccount.create(payload);
      logger.info(`Compte d'hébergement "${account.name}" créé`);
      res.status(201).json({ success: true, data: serialize(account, { withSites: false }) });
    } catch (error) {
      logger.error("Erreur création compte hébergement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création du compte",
      });
    }
  }
);

// PUT /api/hosting-accounts/:id
router.put(
  "/:id",
  validators.map((v) => v.optional({ nullable: true })),
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const account = await HostingAccount.findByPk(req.params.id);
      if (!account)
        return res
          .status(404)
          .json({ success: false, message: "Compte non trouvé" });

      const fields = [
        "name",
        "provider",
        "login",
        "panel_url",
        "account_email",
        "expires_at",
        "notes",
      ];
      const updateData = {};
      fields.forEach((f) => {
        if (req.body[f] !== undefined) updateData[f] = req.body[f] || null;
      });

      await account.update(updateData);
      logger.info(`Compte d'hébergement #${account.id} mis à jour`);
      res.json({ success: true, message: "Compte mis à jour" });
    } catch (error) {
      logger.error("Erreur mise à jour compte hébergement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du compte",
      });
    }
  }
);

// DELETE /api/hosting-accounts/:id (les sites sont détachés, pas supprimés)
router.delete("/:id", requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const account = await HostingAccount.findByPk(req.params.id);
    if (!account)
      return res
        .status(404)
        .json({ success: false, message: "Compte non trouvé" });

    await account.destroy(); // FK ON DELETE SET NULL : les sites sont détachés
    logger.info(`Compte d'hébergement #${req.params.id} supprimé`);
    res.json({ success: true, message: "Compte supprimé" });
  } catch (error) {
    logger.error("Erreur suppression compte hébergement:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du compte",
    });
  }
});

module.exports = router;
