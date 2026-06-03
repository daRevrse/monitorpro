// ========================================
// backend/routes/websites.js
// ========================================
const express = require("express");
const { Op } = require("sequelize");
const { body, validationResult } = require("express-validator");
const { Website, Company, WebsiteCheck } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const monitorService = require("../services/monitorService");
const settingsService = require("../services/settingsService");
const logger = require("../utils/logger");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/websites - Liste des sites
router.get("/", async (req, res) => {
  try {
    const { company_id, role } = req.user;
    const whereClause = {};

    const websites = await Website.findAll({
      where: whereClause,
      include: ["company", "creator", "hostingAccount"],
      order: [["name", "ASC"]],
    });

    // Récupérer les checks des dernières 24h pour calculer les métriques live
    const siteIds = websites.map((s) => s.id);
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let checks = [];
    if (siteIds.length > 0) {
      checks = await WebsiteCheck.findAll({
        where: {
          website_id: { [Op.in]: siteIds },
          checked_at: { [Op.gte]: last24h },
        },
        order: [["checked_at", "DESC"]],
      });
    }

    // Regrouper par site (les checks sont déjà triés du plus récent au plus ancien)
    const checksBySite = {};
    for (const check of checks) {
      if (!checksBySite[check.website_id]) {
        checksBySite[check.website_id] = [];
      }
      checksBySite[check.website_id].push(check);
    }

    res.json({
      success: true,
      data: websites.map((site) => {
        const siteChecks = checksBySite[site.id] || [];
        const latest = siteChecks[0] || null;
        const upCount = siteChecks.filter((c) => c.status === "up").length;
        const uptime24h =
          siteChecks.length > 0
            ? parseFloat(((upCount / siteChecks.length) * 100).toFixed(2))
            : null;
        const sslCheck = siteChecks.find((c) => c.ssl_expires_at) || null;

        return {
          id: site.id,
          name: site.name,
          url: site.url,
          client_name: site.client_name,
          hosting_account_id: site.hosting_account_id,
          hosting_account: site.hostingAccount
            ? { id: site.hostingAccount.id, name: site.hostingAccount.name }
            : null,
          site_type: site.site_type,
          hosting_provider: site.hosting_provider,
          hosting_account: site.hosting_account,
          hosting_panel_url: site.hosting_panel_url,
          hosting_account_email: site.hosting_account_email,
          hosting_expires_at: site.hosting_expires_at,
          server_ip: site.server_ip,
          notes: site.notes,
          status: site.status,
          check_interval: site.check_interval,
          timeout_threshold: site.timeout_threshold,
          ssl_check: site.ssl_check,
          is_active: site.is_active,
          company: site.company ? site.company.name : null,
          created_by: site.creator ? site.creator.getFullName() : null,
          created_at: site.created_at,
          updated_at: site.updated_at,
          // Métriques live (24h)
          last_check: latest ? latest.checked_at : null,
          last_status_code: latest ? latest.status_code : null,
          last_response_time: latest ? latest.response_time : null,
          ssl_valid: sslCheck ? sslCheck.ssl_valid : null,
          ssl_expires_at: sslCheck ? sslCheck.ssl_expires_at : null,
          uptime_24h: uptime24h,
        };
      }),
    });
  } catch (error) {
    logger.error("Erreur liste sites:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des sites",
    });
  }
});

// POST /api/websites - Créer un site
router.post(
  "/",
  [
    body("name").isLength({ min: 1, max: 255 }).trim(),
    body("url").isURL(),
    body("client_name").optional({ nullable: true }).isLength({ max: 255 }).trim(),
    body("hosting_account_id").optional({ nullable: true }).isInt(),
    body("site_type").optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body("hosting_provider")
      .optional({ nullable: true })
      .isLength({ max: 255 })
      .trim(),
    body("hosting_account")
      .optional({ nullable: true })
      .isLength({ max: 255 })
      .trim(),
    body("hosting_panel_url")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),
    body("hosting_account_email")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail(),
    body("hosting_expires_at")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601(),
    body("server_ip").optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body("notes").optional({ nullable: true }).isLength({ max: 5000 }).trim(),
    body("check_interval").optional().isInt({ min: 60, max: 86400 }),
    body("timeout_threshold").optional().isInt({ min: 1000, max: 120000 }),
    body("ssl_check").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        name,
        url,
        client_name,
        hosting_account_id,
        site_type,
        hosting_provider,
        hosting_account,
        hosting_panel_url,
        hosting_account_email,
        hosting_expires_at,
        server_ip,
        notes,
        check_interval,
        timeout_threshold,
        ssl_check,
      } = req.body;
      const { company_id, id: user_id } = req.user;

      const website = await Website.create({
        name,
        url,
        client_name,
        hosting_account_id: hosting_account_id || null,
        site_type: site_type || null,
        hosting_provider: hosting_provider || null,
        hosting_account: hosting_account || null,
        hosting_panel_url: hosting_panel_url || null,
        hosting_account_email: hosting_account_email || null,
        hosting_expires_at: hosting_expires_at || null,
        server_ip: server_ip || null,
        notes: notes || null,
        company_id,
        created_by: user_id,
        check_interval: check_interval || settingsService.get().default_check_interval,
        timeout_threshold:
          timeout_threshold || settingsService.get().default_timeout,
        ssl_check:
          ssl_check !== undefined
            ? ssl_check
            : settingsService.get().default_ssl_check,
      });

      // Ajouter le site au monitoring
      await monitorService.addSiteToMonitoring(website.id);

      logger.info(`Site ${name} créé par utilisateur ${user_id}`);

      res.status(201).json({
        success: true,
        message: "Site créé avec succès",
        data: {
          id: website.id,
          name: website.name,
          url: website.url,
          status: website.status,
        },
      });
    } catch (error) {
      logger.error("Erreur création site:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création du site",
      });
    }
  }
);

// PUT /api/websites/:id - Mettre à jour un site
router.put(
  "/:id",
  [
    body("name").optional().isLength({ min: 1, max: 255 }).trim(),
    body("url").optional().isURL(),
    body("client_name").optional({ nullable: true }).isLength({ max: 255 }).trim(),
    body("hosting_account_id").optional({ nullable: true }).isInt(),
    body("site_type").optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body("hosting_provider")
      .optional({ nullable: true })
      .isLength({ max: 255 })
      .trim(),
    body("hosting_account")
      .optional({ nullable: true })
      .isLength({ max: 255 })
      .trim(),
    body("hosting_panel_url")
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),
    body("hosting_account_email")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail(),
    body("hosting_expires_at")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601(),
    body("server_ip").optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body("notes").optional({ nullable: true }).isLength({ max: 5000 }).trim(),
    body("check_interval").optional().isInt({ min: 60, max: 86400 }),
    body("timeout_threshold").optional().isInt({ min: 1000, max: 120000 }),
    body("ssl_check").optional().isBoolean(),
    body("is_active").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { company_id, role } = req.user;
      const whereClause = {};

      const website = await Website.findOne({
        where: { id, ...whereClause },
      });

      if (!website) {
        return res.status(404).json({
          success: false,
          message: "Site non trouvé",
        });
      }

      const updateData = {};
      [
        "name",
        "url",
        "client_name",
        "hosting_account_id",
        "site_type",
        "hosting_provider",
        "hosting_account",
        "hosting_panel_url",
        "hosting_account_email",
        "hosting_expires_at",
        "server_ip",
        "notes",
        "check_interval",
        "timeout_threshold",
        "ssl_check",
        "is_active",
      ].forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await website.update(updateData);

      // Gérer le monitoring selon le statut actif
      if (updateData.is_active === false) {
        monitorService.removeSiteFromMonitoring(website.id);
      } else if (updateData.is_active === true) {
        await monitorService.addSiteToMonitoring(website.id);
      }

      logger.info(`Site ${id} mis à jour par utilisateur ${req.user.id}`);

      res.json({
        success: true,
        message: "Site mis à jour avec succès",
      });
    } catch (error) {
      logger.error("Erreur mise à jour site:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du site",
      });
    }
  }
);

// DELETE /api/websites/:id - Supprimer un site
router.delete("/:id", requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, role } = req.user;
    const whereClause = {};

    const website = await Website.findOne({
      where: { id, ...whereClause },
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Site non trouvé",
      });
    }

    // Retirer du monitoring
    monitorService.removeSiteFromMonitoring(website.id);

    // Supprimer le site
    await website.destroy();

    logger.info(`Site ${website.name} supprimé par utilisateur ${req.user.id}`);

    res.json({
      success: true,
      message: "Site supprimé avec succès",
    });
  } catch (error) {
    logger.error("Erreur suppression site:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du site",
    });
  }
});

module.exports = router;
