// ========================================
// backend/routes/incidents.js
// ========================================
const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { Incident, Website, User } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

const router = express.Router();
router.use(authenticateToken);

// GET /api/incidents - Liste des incidents
router.get(
  "/",
  [
    query("status").optional().isIn(["open", "acknowledged", "resolved"]),
    query("severity").optional().isIn(["low", "medium", "high", "critical"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { company_id, role } = req.user;
      const { status, severity, limit = 20, offset = 0 } = req.query;
      const whereClause = role === "admin" && !company_id ? {} : { company_id };

      const incidentWhere = {};
      if (status) incidentWhere.status = status;
      if (severity) incidentWhere.severity = severity;

      const incidents = await Incident.findAndCountAll({
        where: incidentWhere,
        include: [
          {
            model: Website,
            as: "website",
            where: whereClause,
            include: ["company"],
          },
        ],
        order: [["started_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: {
          incidents: incidents.rows.map((incident) => ({
            id: incident.id,
            status: incident.status,
            severity: incident.severity,
            description: incident.description,
            started_at: incident.started_at,
            resolved_at: incident.resolved_at,
            website: {
              id: incident.website.id,
              name: incident.website.name,
              url: incident.website.url,
              company: incident.website.company
                ? incident.website.company.name
                : null,
            },
          })),
          pagination: {
            total: incidents.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: incidents.count > parseInt(offset) + parseInt(limit),
          },
        },
      });
    } catch (error) {
      logger.error("Erreur liste incidents:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des incidents",
      });
    }
  }
);

module.exports = router;
