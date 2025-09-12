// backend/jobs/monitorCron.js
const cron = require("node-cron");
const { WebsiteCheck, Website, Incident } = require("../models");
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const monitorService = require("../services/monitorService");
const alertService = require("../services/alertService");

class MonitorCron {
  constructor() {
    this.jobs = new Map();
    this.isStarted = false;
  }

  // Démarrer tous les jobs cron
  startAllJobs() {
    if (this.isStarted) {
      logger.warn("Les jobs cron sont déjà démarrés");
      return;
    }

    logger.info("Démarrage des tâches cron de monitoring");

    // Job principal de monitoring (démarrer le service)
    this.scheduleMonitoringService();

    // Nettoyage des anciennes données (quotidien à 2h)
    this.scheduleDataCleanup();

    // Génération des rapports (quotidien à 6h)
    this.scheduleReportGeneration();

    // Nettoyage des sessions expirées (toutes les heures)
    this.scheduleSessionCleanup();

    // Vérification de la santé du système (toutes les 5 minutes)
    this.scheduleHealthCheck();

    // Nettoyage des alertes en cooldown (toutes les 30 minutes)
    this.scheduleAlertCleanup();

    this.isStarted = true;
    logger.info("Toutes les tâches cron sont démarrées");
  }

  // Arrêter tous les jobs cron
  stopAllJobs() {
    for (const [name, task] of this.jobs) {
      task.stop();
      logger.info(`Job cron arrêté: ${name}`);
    }

    this.jobs.clear();
    this.isStarted = false;

    // Arrêter le service de monitoring
    monitorService.stopMonitoring();

    logger.info("Toutes les tâches cron sont arrêtées");
  }

  // Démarrer le service de monitoring
  scheduleMonitoringService() {
    // Démarrer immédiatement
    setTimeout(async () => {
      try {
        await monitorService.startMonitoring();
        logger.info("Service de monitoring démarré via cron");
      } catch (error) {
        logger.error(
          "Erreur lors du démarrage du service de monitoring:",
          error
        );
      }
    }, 5000);

    // Redémarrer le service toutes les 6 heures pour éviter les fuites mémoire
    const restartTask = cron.schedule(
      "0 */6 * * *",
      async () => {
        try {
          logger.info("Redémarrage programmé du service de monitoring");
          monitorService.stopMonitoring();

          // Attendre 10 secondes puis redémarrer
          setTimeout(async () => {
            await monitorService.startMonitoring();
            logger.info("Service de monitoring redémarré");
          }, 10000);
        } catch (error) {
          logger.error("Erreur lors du redémarrage du service:", error);
        }
      },
      {
        scheduled: false,
      }
    );

    restartTask.start();
    this.jobs.set("monitoring-restart", restartTask);
  }

  // Nettoyage des données anciennes
  scheduleDataCleanup() {
    const cleanupTask = cron.schedule(
      "0 2 * * *",
      async () => {
        logger.info("Début du nettoyage des données anciennes");

        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

          // Supprimer les checks de plus de 30 jours (garder 1 sur 10)
          const oldChecks = await WebsiteCheck.findAll({
            where: {
              checked_at: { [Op.lt]: thirtyDaysAgo },
            },
            order: [["checked_at", "ASC"]],
          });

          let deletedChecks = 0;
          for (let i = 0; i < oldChecks.length; i++) {
            // Garder 1 check sur 10 pour les statistiques historiques
            if (i % 10 !== 0) {
              await oldChecks[i].destroy();
              deletedChecks++;
            }
          }

          // Supprimer complètement les checks de plus de 90 jours
          const veryOldChecksCount = await WebsiteCheck.destroy({
            where: {
              checked_at: { [Op.lt]: ninetyDaysAgo },
            },
          });

          // Fermer automatiquement les anciens incidents ouverts (> 7 jours)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const autoClosedIncidents = await Incident.update(
            {
              status: "resolved",
              resolved_at: new Date(),
              description: "Incident fermé automatiquement après 7 jours",
            },
            {
              where: {
                status: "open",
                started_at: { [Op.lt]: sevenDaysAgo },
              },
            }
          );

          logger.info(`Nettoyage terminé:
          - ${deletedChecks} checks supprimés (30j+)
          - ${veryOldChecksCount} checks supprimés (90j+)
          - ${autoClosedIncidents[0]} incidents fermés automatiquement`);
        } catch (error) {
          logger.error("Erreur lors du nettoyage des données:", error);
        }
      },
      {
        scheduled: false,
        timezone: "Europe/Paris",
      }
    );

    cleanupTask.start();
    this.jobs.set("data-cleanup", cleanupTask);
  }

  // Génération des rapports quotidiens
  scheduleReportGeneration() {
    const reportTask = cron.schedule(
      "0 6 * * *",
      async () => {
        logger.info("Génération des rapports quotidiens");

        try {
          await this.generateDailyReports();
          logger.info("Rapports quotidiens générés avec succès");
        } catch (error) {
          logger.error("Erreur lors de la génération des rapports:", error);
        }
      },
      {
        scheduled: false,
        timezone: "Europe/Paris",
      }
    );

    reportTask.start();
    this.jobs.set("report-generation", reportTask);
  }

  // Génération des rapports quotidiens
  async generateDailyReports() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

    // Obtenir les statistiques pour chaque site
    const sites = await Website.findAll({
      where: { is_active: true },
      include: ["company"],
    });

    const reportData = [];

    for (const site of sites) {
      const checks = await WebsiteCheck.findAll({
        where: {
          website_id: site.id,
          checked_at: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
        order: [["checked_at", "ASC"]],
      });

      if (checks.length === 0) continue;

      const upChecks = checks.filter((c) => c.status === "up");
      const downChecks = checks.filter((c) => c.status === "down");
      const warningChecks = checks.filter((c) => c.status === "warning");

      const uptime = (upChecks.length / checks.length) * 100;
      const avgResponseTime =
        upChecks.reduce((sum, c) => sum + (c.response_time || 0), 0) /
          upChecks.length || 0;

      reportData.push({
        site: {
          id: site.id,
          name: site.name,
          url: site.url,
          company: site.company.name,
        },
        stats: {
          uptime: uptime.toFixed(2),
          totalChecks: checks.length,
          upChecks: upChecks.length,
          downChecks: downChecks.length,
          warningChecks: warningChecks.length,
          avgResponseTime: Math.round(avgResponseTime),
        },
      });
    }

    // Sauvegarder ou envoyer le rapport
    // Pour l'instant, on le log
    logger.info("Rapport quotidien:", {
      date: yesterday.toISOString().split("T")[0],
      sitesMonitored: reportData.length,
      summary: reportData.map((r) => ({
        site: r.site.name,
        uptime: r.stats.uptime + "%",
        avgResponse: r.stats.avgResponseTime + "ms",
      })),
    });

    return reportData;
  }

  // Nettoyage des sessions expirées
  scheduleSessionCleanup() {
    const sessionCleanupTask = cron.schedule(
      "0 * * * *",
      async () => {
        try {
          const { UserSession } = require("../models");

          const deletedSessions = await UserSession.destroy({
            where: {
              [Op.or]: [
                { expires_at: { [Op.lt]: new Date() } },
                { is_active: false },
              ],
            },
          });

          if (deletedSessions > 0) {
            logger.info(`${deletedSessions} sessions expirées nettoyées`);
          }
        } catch (error) {
          logger.error("Erreur lors du nettoyage des sessions:", error);
        }
      },
      {
        scheduled: false,
      }
    );

    sessionCleanupTask.start();
    this.jobs.set("session-cleanup", sessionCleanupTask);
  }

  // Vérification de la santé du système
  scheduleHealthCheck() {
    const healthCheckTask = cron.schedule(
      "*/5 * * * *",
      async () => {
        try {
          const stats = monitorService.getServiceStats();
          const alertStats = alertService.getServiceStats();

          // Vérifier si le service de monitoring fonctionne
          if (!stats.isRunning) {
            logger.error("⚠️ Service de monitoring arrêté - redémarrage...");
            await monitorService.startMonitoring();
          }

          // Vérifier la charge du système
          if (stats.currentChecks >= stats.maxConcurrentChecks * 0.9) {
            logger.warn(
              `⚠️ Charge système élevée: ${stats.currentChecks}/${stats.maxConcurrentChecks}`
            );
          }

          // Vérifier la queue d'alertes
          if (alertStats.queueLength > 50) {
            logger.warn(
              `⚠️ Queue d'alertes surchargée: ${alertStats.queueLength} alertes en attente`
            );
          }

          // Log des statistiques (debug seulement)
          logger.debug("Health check:", {
            monitoring: stats,
            alerts: alertStats,
            timestamp: new Date(),
          });
        } catch (error) {
          logger.error("Erreur lors du health check:", error);
        }
      },
      {
        scheduled: false,
      }
    );

    healthCheckTask.start();
    this.jobs.set("health-check", healthCheckTask);
  }

  // Nettoyage des alertes en cooldown
  scheduleAlertCleanup() {
    const alertCleanupTask = cron.schedule(
      "*/30 * * * *",
      async () => {
        try {
          alertService.cleanupCooldowns();
          logger.debug("Nettoyage des cooldowns d'alertes effectué");
        } catch (error) {
          logger.error("Erreur lors du nettoyage des alertes:", error);
        }
      },
      {
        scheduled: false,
      }
    );

    alertCleanupTask.start();
    this.jobs.set("alert-cleanup", alertCleanupTask);
  }

  // Obtenir le statut de tous les jobs
  getJobsStatus() {
    const status = {};

    for (const [name, task] of this.jobs) {
      status[name] = {
        running: task.running,
        scheduled: task.scheduled,
      };
    }

    return {
      isStarted: this.isStarted,
      totalJobs: this.jobs.size,
      jobs: status,
    };
  }

  // Redémarrer un job spécifique
  restartJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      job.start();
      logger.info(`Job ${jobName} redémarré`);
      return true;
    }
    return false;
  }
}

module.exports = new MonitorCron();
