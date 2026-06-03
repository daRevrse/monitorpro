// ========================================
// backend/routes/interventions.js
// ========================================
const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { Intervention, Website, User } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();
router.use(authenticateToken);

const TYPES = ["maintenance", "corrective", "update", "incident", "other"];
const RESOLUTIONS = ["resolved", "pending", "follow_up", "failed"];

// Vérifie qu'un site appartient bien au périmètre de l'utilisateur
const findScopedWebsite = async (websiteId, user) => {
  const { company_id, role } = user;
  const whereClause = {};
  return Website.findOne({ where: { id: websiteId, ...whereClause } });
};

const serialize = (intervention) => {
  const started = intervention.started_at
    ? new Date(intervention.started_at)
    : null;
  const ended = intervention.ended_at ? new Date(intervention.ended_at) : null;
  const durationSeconds =
    started && ended ? Math.round((ended - started) / 1000) : null;

  return {
    id: intervention.id,
    website_id: intervention.website_id,
    title: intervention.title,
    description: intervention.description,
    intervention_type: intervention.intervention_type,
    resolution: intervention.resolution,
    state: intervention.state,
    started_at: intervention.started_at,
    ended_at: intervention.ended_at,
    duration_seconds: durationSeconds,
    technician: intervention.technician
      ? intervention.technician.getFullName()
      : null,
    website: intervention.website
      ? {
          id: intervention.website.id,
          name: intervention.website.name,
          url: intervention.website.url,
        }
      : null,
  };
};

// GET /api/interventions - Liste (globale ou par site) avec filtres
router.get(
  "/",
  [
    query("website_id").optional().isInt(),
    query("state").optional().isIn(["in_progress", "ended"]),
    query("intervention_type").optional().isIn(TYPES),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const where = {};
      if (req.query.website_id) where.website_id = req.query.website_id;
      if (req.query.state) where.state = req.query.state;
      if (req.query.intervention_type)
        where.intervention_type = req.query.intervention_type;

      const interventions = await Intervention.findAll({
        where,
        include: [
          { model: User, as: "technician" },
          { model: Website, as: "website" },
        ],
        order: [["started_at", "DESC"]],
      });

      res.json({
        success: true,
        data: interventions.map(serialize),
      });
    } catch (error) {
      logger.error("Erreur liste interventions:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des interventions",
      });
    }
  }
);

// POST /api/interventions - Démarrer une intervention
router.post(
  "/",
  [
    body("website_id").isInt(),
    body("title").isLength({ min: 1, max: 255 }).trim(),
    body("intervention_type").optional().isIn(TYPES),
    body("description").optional({ nullable: true }).isLength({ max: 5000 }).trim(),
  ],
  requireRole(["admin", "manager", "technician"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { website_id, title, intervention_type, description } = req.body;

      const website = await findScopedWebsite(website_id, req.user);
      if (!website)
        return res
          .status(404)
          .json({ success: false, message: "Site non trouvé" });

      // Une seule intervention active par site
      const active = await Intervention.findOne({
        where: { website_id, state: "in_progress" },
      });
      if (active) {
        return res.status(409).json({
          success: false,
          message: "Une intervention est déjà en cours sur ce site",
        });
      }

      const intervention = await Intervention.create({
        website_id,
        performed_by: req.user.id,
        title,
        description: description || null,
        intervention_type: intervention_type || "maintenance",
        state: "in_progress",
        started_at: new Date(),
      });

      logger.info(
        `Intervention #${intervention.id} démarrée sur le site ${website_id} par ${req.user.email}`
      );

      const reloaded = await Intervention.findByPk(intervention.id, {
        include: [{ model: User, as: "technician" }],
      });

      res.status(201).json({
        success: true,
        message: "Intervention démarrée",
        data: serialize(reloaded),
      });
    } catch (error) {
      logger.error("Erreur démarrage intervention:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du démarrage de l'intervention",
      });
    }
  }
);

// PUT /api/interventions/:id/end - Terminer une intervention
router.put(
  "/:id/end",
  [
    body("resolution").optional({ nullable: true }).isIn(RESOLUTIONS),
    body("description").optional({ nullable: true }).isLength({ max: 5000 }).trim(),
  ],
  requireRole(["admin", "manager", "technician"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const intervention = await Intervention.findByPk(req.params.id, {
        include: [{ model: User, as: "technician" }],
      });
      if (!intervention)
        return res
          .status(404)
          .json({ success: false, message: "Intervention non trouvée" });

      // Vérifier le périmètre via le site
      const website = await findScopedWebsite(
        intervention.website_id,
        req.user
      );
      if (!website)
        return res
          .status(404)
          .json({ success: false, message: "Site non trouvé" });

      if (intervention.state === "ended") {
        return res.status(409).json({
          success: false,
          message: "Cette intervention est déjà terminée",
        });
      }

      const { resolution, description } = req.body;
      await intervention.update({
        state: "ended",
        ended_at: new Date(),
        resolution: resolution || "resolved",
        ...(description !== undefined ? { description } : {}),
      });

      logger.info(
        `Intervention #${intervention.id} terminée par ${req.user.email}`
      );

      res.json({
        success: true,
        message: "Intervention terminée",
        data: serialize(intervention),
      });
    } catch (error) {
      logger.error("Erreur fin intervention:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la clôture de l'intervention",
      });
    }
  }
);

// PUT /api/interventions/:id - Éditer une intervention
router.put(
  "/:id",
  [
    body("title").optional().isLength({ min: 1, max: 255 }).trim(),
    body("description").optional({ nullable: true }).isLength({ max: 5000 }).trim(),
    body("intervention_type").optional().isIn(TYPES),
    body("resolution").optional({ nullable: true }).isIn(RESOLUTIONS),
  ],
  requireRole(["admin", "manager", "technician"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const intervention = await Intervention.findByPk(req.params.id, {
        include: [
          { model: User, as: "technician" },
          { model: Website, as: "website" },
        ],
      });
      if (!intervention)
        return res
          .status(404)
          .json({ success: false, message: "Intervention non trouvée" });

      const updateData = {};
      ["title", "description", "intervention_type", "resolution"].forEach(
        (f) => {
          if (req.body[f] !== undefined) updateData[f] = req.body[f];
        }
      );

      await intervention.update(updateData);
      await intervention.reload({
        include: [
          { model: User, as: "technician" },
          { model: Website, as: "website" },
        ],
      });

      logger.info(`Intervention #${intervention.id} modifiée par ${req.user.email}`);
      res.json({
        success: true,
        message: "Intervention mise à jour",
        data: serialize(intervention),
      });
    } catch (error) {
      logger.error("Erreur édition intervention:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de l'intervention",
      });
    }
  }
);

// DELETE /api/interventions/:id - Supprimer une intervention
router.delete(
  "/:id",
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const intervention = await Intervention.findByPk(req.params.id);
      if (!intervention)
        return res
          .status(404)
          .json({ success: false, message: "Intervention non trouvée" });

      await intervention.destroy();
      logger.info(`Intervention #${req.params.id} supprimée par ${req.user.email}`);
      res.json({ success: true, message: "Intervention supprimée" });
    } catch (error) {
      logger.error("Erreur suppression intervention:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'intervention",
      });
    }
  }
);

module.exports = router;
