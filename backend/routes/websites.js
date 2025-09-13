// ========================================
// backend/routes/websites.js
// ========================================
const express = require("express");
const { body, validationResult } = require("express-validator");
const { Website, Company } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const monitorService = require("../services/monitorService");
const logger = require("../utils/logger");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/websites - Liste des sites
router.get("/", async (req, res) => {
  try {
    const { company_id, role } = req.user;
    const whereClause = role === "admin" && !company_id ? {} : { company_id };

    const websites = await Website.findAll({
      where: whereClause,
      include: ["company", "creator"],
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      data: websites.map((site) => ({
        id: site.id,
        name: site.name,
        url: site.url,
        client_name: site.client_name,
        status: site.status,
        check_interval: site.check_interval,
        timeout_threshold: site.timeout_threshold,
        ssl_check: site.ssl_check,
        is_active: site.is_active,
        company: site.company ? site.company.name : null,
        created_by: site.creator ? site.creator.getFullName() : null,
        created_at: site.created_at,
        updated_at: site.updated_at,
      })),
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
    body("client_name").optional().isLength({ max: 255 }).trim(),
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
        check_interval,
        timeout_threshold,
        ssl_check,
      } = req.body;
      const { company_id, id: user_id } = req.user;

      const website = await Website.create({
        name,
        url,
        client_name,
        company_id,
        created_by: user_id,
        check_interval: check_interval || 300,
        timeout_threshold: timeout_threshold || 10000,
        ssl_check: ssl_check !== undefined ? ssl_check : true,
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
    body("client_name").optional().isLength({ max: 255 }).trim(),
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
      const whereClause = role === "admin" && !company_id ? {} : { company_id };

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
    const whereClause = role === "admin" && !company_id ? {} : { company_id };

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
