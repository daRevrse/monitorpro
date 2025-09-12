// backend/routes/monitoring.js
const express = require("express");
const { Op } = require("sequelize");
const { body, query, validationResult } = require("express-validator");
const { Website, WebsiteCheck, Incident, Company } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const monitorService = require("../services/monitorService");
const alertService = require("../services/alertService");
const logger = require("../utils/logger");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/monitoring/dashboard - Données du dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const { company_id, role } = req.user;

    const whereClause = role === "admin" && !company_id ? {} : { company_id };

    const sites = await Website.findAll({
      where: { ...whereClause, is_active: true },
      include: ["company"],
      order: [["name", "ASC"]],
    });

    const stats = {
      total: sites.length,
      up: sites.filter((s) => s.status === "up").length,
      down: sites.filter((s) => s.status === "down").length,
      warning: sites.filter((s) => s.status === "warning").length,
      maintenance: sites.filter((s) => s.status === "maintenance").length,
    };

    const openIncidents = await Incident.findAll({
      where: { status: "open" },
      include: [
        {
          model: Website,
          as: "website",
          where: whereClause,
          include: ["company"],
        },
      ],
      order: [["started_at", "DESC"]],
      limit: 10,
    });

    const recentChecks = await WebsiteCheck.findAll({
      where: {
        checked_at: {
          [Op.gte]: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
      include: [
        {
          model: Website,
          as: "website",
          where: whereClause,
        },
      ],
      order: [["checked_at", "DESC"]],
      limit: 100,
    });

    res.json({
      success: true,
      data: {
        stats,
        sites: sites.map((site) => {
          const lastCheck = recentChecks.find((c) => c.website_id === site.id);
          return {
            id: site.id,
            name: site.name,
            url: site.url,
            client_name: site.client_name,
            status: site.status,
            company: site.company ? site.company.name : null,
            last_check: lastCheck?.checked_at || null,
            response_time: lastCheck?.response_time || null,
          };
        }),
        incidents: openIncidents.map((incident) => ({
          id: incident.id,
          website: {
            id: incident.website.id,
            name: incident.website.name,
            url: incident.website.url,
          },
          severity: incident.severity,
          started_at: incident.started_at,
          description: incident.description,
        })),
      },
    });
  } catch (error) {
    logger.error("Erreur dashboard monitoring:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données du dashboard",
    });
  }
});

// GET /api/monitoring/service-status
router.get(
  "/service-status",
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const monitorStats = monitorService.getServiceStats();
      const alertStats = alertService.getServiceStats();

      res.json({
        success: true,
        data: {
          monitoring_service: monitorStats,
          alert_service: alertStats,
          system: {
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            node_version: process.version,
          },
        },
      });
    } catch (error) {
      logger.error("Erreur statut service:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors de la récupération du statut du service",
        });
    }
  }
);

// GET /api/monitoring/sites/:id
router.get("/sites/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, role } = req.user;

    const whereClause = role === "admin" && !company_id ? {} : { company_id };

    const site = await Website.findOne({
      where: { id, ...whereClause },
      include: ["company"],
    });

    if (!site) {
      return res
        .status(404)
        .json({ success: false, message: "Site non trouvé" });
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const checks = await WebsiteCheck.findAll({
      where: { website_id: site.id, checked_at: { [Op.gte]: last24h } },
      order: [["checked_at", "DESC"]],
    });

    const upChecks = checks.filter((c) => c.status === "up");
    const uptime =
      checks.length > 0 ? (upChecks.length / checks.length) * 100 : 0;
    const avgResponseTime =
      upChecks.length > 0
        ? upChecks.reduce((sum, c) => sum + (c.response_time || 0), 0) /
          upChecks.length
        : 0;

    const incidents = await Incident.findAll({
      where: { website_id: site.id },
      order: [["started_at", "DESC"]],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        site: {
          id: site.id,
          name: site.name,
          url: site.url,
          client_name: site.client_name,
          status: site.status,
          check_interval: site.check_interval,
          timeout_threshold: site.timeout_threshold,
          ssl_check: site.ssl_check,
          company: site.company ? site.company.name : null,
        },
        stats: {
          uptime: parseFloat(uptime.toFixed(2)),
          avg_response_time: Math.round(avgResponseTime),
          total_checks_24h: checks.length,
          up_checks_24h: upChecks.length,
        },
        recent_checks: checks.slice(0, 20).map((check) => ({
          id: check.id,
          status: check.status,
          status_code: check.status_code,
          response_time: check.response_time,
          error_message: check.error_message,
          checked_at: check.checked_at,
        })),
        incidents: incidents.map((incident) => ({
          id: incident.id,
          status: incident.status,
          severity: incident.severity,
          description: incident.description,
          started_at: incident.started_at,
          resolved_at: incident.resolved_at,
        })),
      },
    });
  } catch (error) {
    logger.error("Erreur détails site:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur lors de la récupération des détails du site",
      });
  }
});

// POST /api/monitoring/sites/:id/check
router.post("/sites/:id/check", async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, role } = req.user;

    const whereClause = role === "admin" && !company_id ? {} : { company_id };

    const site = await Website.findOne({
      where: { id, ...whereClause },
      include: ["company"],
    });

    if (!site) {
      return res
        .status(404)
        .json({ success: false, message: "Site non trouvé" });
    }

    monitorService.scheduleCheck(site, 1000);

    logger.info(
      `Vérification forcée demandée pour ${site.url} par ${req.user.email}`
    );

    res.json({ success: true, message: "Vérification programmée" });
  } catch (error) {
    logger.error("Erreur vérification forcée:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Erreur lors de la programmation de la vérification",
      });
  }
});

// GET /api/monitoring/incidents
router.get(
  "/incidents",
  [
    query("status").optional().isIn(["open", "acknowledged", "resolved"]),
    query("severity").optional().isIn(["low", "medium", "high", "critical"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("offset").optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

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
      res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors de la récupération des incidents",
        });
    }
  }
);

// PUT /api/monitoring/incidents/:id
router.put(
  "/incidents/:id",
  [
    body("status").optional().isIn(["open", "acknowledged", "resolved"]),
    body("description").optional().isLength({ max: 500 }),
  ],
  requireRole(["admin", "manager", "technician"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { id } = req.params;
      const { status, description } = req.body;
      const { company_id, role } = req.user;
      const whereClause = role === "admin" && !company_id ? {} : { company_id };

      const incident = await Incident.findOne({
        where: { id },
        include: [{ model: Website, as: "website", where: whereClause }],
      });

      if (!incident)
        return res
          .status(404)
          .json({ success: false, message: "Incident non trouvé" });

      const updateData = {};
      if (status) {
        updateData.status = status;
        if (status === "acknowledged") updateData.acknowledged_by = req.user.id;
        if (status === "resolved") {
          updateData.resolved_by = req.user.id;
          updateData.resolved_at = new Date();
        }
      }
      if (description) updateData.description = description;

      await incident.update(updateData);

      logger.info(
        `Incident ${id} mis à jour par ${req.user.email}: ${JSON.stringify(
          updateData
        )}`
      );

      res.json({ success: true, message: "Incident mis à jour" });
    } catch (error) {
      logger.error("Erreur mise à jour incident:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors de la mise à jour de l'incident",
        });
    }
  }
);

// GET /api/monitoring/stats
router.get(
  "/stats",
  [
    query("period").optional().isIn(["1h", "24h", "7d", "30d"]),
    query("site_id").optional().isInt(),
  ],
  async (req, res) => {
    try {
      const { company_id, role } = req.user;
      const { period = "24h", site_id } = req.query;
      const whereClause = role === "admin" && !company_id ? {} : { company_id };

      const periods = {
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };
      const since = new Date(Date.now() - periods[period]);

      const websiteWhere = { ...whereClause };
      if (site_id) websiteWhere.id = site_id;

      const checks = await WebsiteCheck.findAll({
        where: { checked_at: { [Op.gte]: since } },
        include: [{ model: Website, as: "website", where: websiteWhere }],
        order: [["checked_at", "ASC"]],
      });

      const totalChecks = checks.length;
      const upChecks = checks.filter((c) => c.status === "up").length;
      const downChecks = checks.filter((c) => c.status === "down").length;
      const warningChecks = checks.filter((c) => c.status === "warning").length;
      const uptime = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;

      const responseTimes = checks
        .filter((c) => c.status === "up" && c.response_time)
        .map((c) => c.response_time);
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, rt) => sum + rt, 0) /
            responseTimes.length
          : 0;

      const groupInterval = period === "1h" ? 5 : period === "24h" ? 60 : 1440;
      const timeline = groupChecksByTime(checks, groupInterval);

      res.json({
        success: true,
        data: {
          period,
          summary: {
            total_checks: totalChecks,
            uptime_percentage: parseFloat(uptime.toFixed(2)),
            avg_response_time: Math.round(avgResponseTime),
            up_checks: upChecks,
            down_checks: downChecks,
            warning_checks: warningChecks,
          },
          timeline,
        },
      });
    } catch (error) {
      logger.error("Erreur statistiques:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors de la récupération des statistiques",
        });
    }
  }
);

// POST /api/monitoring/test-alert
router.post(
  "/test-alert",
  [body("site_id").isInt(), body("email").optional().isEmail()],
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { site_id, email } = req.body;
      const testEmail = email || req.user.email;

      await alertService.testAlert(site_id, testEmail);

      res.json({
        success: true,
        message: `Alerte de test envoyée à ${testEmail}`,
      });
    } catch (error) {
      logger.error("Erreur test alerte:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors de l'envoi de l'alerte de test",
        });
    }
  }
);

// Fonction utilitaire pour grouper les checks
function groupChecksByTime(checks, intervalMinutes) {
  const groups = {};
  checks.forEach((check) => {
    const date = new Date(check.checked_at);
    const roundedMinutes =
      Math.floor(date.getMinutes() / intervalMinutes) * intervalMinutes;
    date.setMinutes(roundedMinutes, 0, 0);
    const key = date.toISOString();
    if (!groups[key]) {
      groups[key] = {
        timestamp: key,
        total: 0,
        up: 0,
        down: 0,
        warning: 0,
        response_times: [],
      };
    }
    groups[key].total++;
    groups[key][check.status]++;
    if (check.status === "up" && check.response_time) {
      groups[key].response_times.push(check.response_time);
    }
  });
  return Object.values(groups)
    .map((g) => ({
      ...g,
      avg_response_time:
        g.response_times.length > 0
          ? Math.round(
              g.response_times.reduce((sum, rt) => sum + rt, 0) /
                g.response_times.length
            )
          : null,
      uptime_percentage: g.total > 0 ? (g.up / g.total) * 100 : 0,
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

module.exports = router;
