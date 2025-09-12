// backend/services/alertService.js
const emailService = require("./emailService");
const { User, Website, Company } = require("../models");
const logger = require("../utils/logger");

class AlertService {
  constructor() {
    this.alertQueue = [];
    this.isProcessing = false;
    this.cooldownPeriod = 10 * 60 * 1000; // 10 minutes entre alertes pour même site
    this.lastAlerts = new Map(); // site_id -> timestamp
  }

  // Envoyer une alerte
  async sendAlert(site, checkResult) {
    try {
      // Vérifier le cooldown
      const lastAlertTime = this.lastAlerts.get(site.id);
      const now = Date.now();

      if (lastAlertTime && now - lastAlertTime < this.cooldownPeriod) {
        logger.debug(`Alerte ignorée pour ${site.url} (cooldown actif)`);
        return;
      }

      // Ajouter à la queue
      this.alertQueue.push({
        site,
        checkResult,
        timestamp: now,
      });

      // Mettre à jour le timestamp de dernière alerte
      this.lastAlerts.set(site.id, now);

      // Traiter la queue si pas déjà en cours
      if (!this.isProcessing) {
        this.processAlertQueue();
      }
    } catch (error) {
      logger.error("Erreur lors de l'envoi d'alerte:", error);
    }
  }

  // Traiter la queue d'alertes
  async processAlertQueue() {
    if (this.isProcessing || this.alertQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.alertQueue.length > 0) {
        const alertData = this.alertQueue.shift();
        await this.processAlert(alertData);

        // Petit délai entre les alertes pour éviter le spam
        await this.delay(1000);
      }
    } catch (error) {
      logger.error("Erreur lors du traitement de la queue d'alertes:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Traiter une alerte individuelle
  async processAlert(alertData) {
    const { site, checkResult } = alertData;

    try {
      // Obtenir les utilisateurs à notifier
      const usersToNotify = await this.getUsersToNotify(site);

      if (usersToNotify.length === 0) {
        logger.warn(`Aucun utilisateur à notifier pour le site ${site.url}`);
        return;
      }

      // Préparer le message d'alerte
      const alertMessage = this.prepareAlertMessage(site, checkResult);

      // Envoyer les notifications
      await Promise.all([
        this.sendEmailAlerts(usersToNotify, alertMessage),
        this.sendWebhookAlert(site, checkResult),
        this.logAlert(site, checkResult, usersToNotify.length),
      ]);

      logger.info(
        `Alerte envoyée pour ${site.url} à ${usersToNotify.length} utilisateurs`
      );
    } catch (error) {
      logger.error(
        `Erreur lors du traitement de l'alerte pour ${site.url}:`,
        error
      );
    }
  }

  // Obtenir les utilisateurs à notifier
  async getUsersToNotify(site) {
    try {
      const users = await User.findAll({
        where: {
          company_id: site.company_id,
          is_active: true,
        },
        include: [
          {
            model: Company,
            as: "company",
          },
        ],
      });

      // Filtrer selon les préférences (à implémenter plus tard)
      return users.filter((user) => {
        // Pour l'instant, notifier tous les admins et managers
        return ["admin", "manager"].includes(user.role);
      });
    } catch (error) {
      logger.error("Erreur lors de la récupération des utilisateurs:", error);
      return [];
    }
  }

  // Préparer le message d'alerte
  prepareAlertMessage(site, checkResult) {
    const isDown = checkResult.status === "down";
    const isRecovered = checkResult.status === "up";
    const isWarning = checkResult.status === "warning";

    let subject, priority, statusIcon, statusText;

    if (isDown) {
      subject = `🚨 ALERTE: ${site.name} est INACCESSIBLE`;
      priority = "high";
      statusIcon = "🔴";
      statusText = "INACCESSIBLE";
    } else if (isRecovered) {
      subject = `✅ RÉCUPÉRATION: ${site.name} est de nouveau accessible`;
      priority = "normal";
      statusIcon = "✅";
      statusText = "RÉCUPÉRÉ";
    } else if (isWarning) {
      subject = `⚠️ AVERTISSEMENT: ${site.name} présente des problèmes`;
      priority = "medium";
      statusIcon = "⚠️";
      statusText = "PROBLÈME DÉTECTÉ";
    }

    return {
      subject,
      priority,
      site: {
        name: site.name,
        url: site.url,
        client: site.client_name,
      },
      status: {
        icon: statusIcon,
        text: statusText,
        code: checkResult.status_code,
        responseTime: checkResult.response_time,
        error: checkResult.error_message,
      },
      timestamp: checkResult.checked_at,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    };
  }

  // Envoyer les alertes par email
  async sendEmailAlerts(users, alertMessage) {
    try {
      const emailPromises = users.map((user) =>
        emailService.sendAlertEmail(user.email, alertMessage)
      );

      await Promise.all(emailPromises);
      logger.debug(`Emails d'alerte envoyés à ${users.length} utilisateurs`);
    } catch (error) {
      logger.error("Erreur lors de l'envoi des emails d'alerte:", error);
    }
  }

  // Envoyer l'alerte via webhook (Slack, Teams, etc.)
  async sendWebhookAlert(site, checkResult) {
    try {
      // À implémenter selon les besoins
      // Exemple pour Slack:
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(site, checkResult);
      }
    } catch (error) {
      logger.error("Erreur lors de l'envoi du webhook:", error);
    }
  }

  // Envoyer une alerte Slack
  async sendSlackAlert(site, checkResult) {
    try {
      const axios = require("axios");

      let color, emoji;
      if (checkResult.status === "down") {
        color = "danger";
        emoji = "🚨";
      } else if (checkResult.status === "warning") {
        color = "warning";
        emoji = "⚠️";
      } else if (checkResult.status === "up") {
        color = "good";
        emoji = "✅";
      }

      const message = {
        text: `${emoji} Alerte MonitorPro`,
        attachments: [
          {
            color: color,
            fields: [
              {
                title: "Site",
                value: `${site.name} (${site.url})`,
                short: false,
              },
              {
                title: "Statut",
                value: checkResult.status.toUpperCase(),
                short: true,
              },
              {
                title: "Temps de réponse",
                value: checkResult.response_time
                  ? `${checkResult.response_time}ms`
                  : "N/A",
                short: true,
              },
            ],
            footer: "MonitorPro",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      if (checkResult.error_message) {
        message.attachments[0].fields.push({
          title: "Erreur",
          value: checkResult.error_message,
          short: false,
        });
      }

      await axios.post(process.env.SLACK_WEBHOOK_URL, message);
      logger.debug("Alerte Slack envoyée");
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'alerte Slack:", error);
    }
  }

  // Logger l'alerte
  async logAlert(site, checkResult, recipientCount) {
    const logData = {
      site_id: site.id,
      site_url: site.url,
      status: checkResult.status,
      error_message: checkResult.error_message,
      response_time: checkResult.response_time,
      recipient_count: recipientCount,
      timestamp: new Date(),
    };

    // Ici on pourrait sauvegarder en BDD ou dans un fichier de log
    logger.info("Alerte envoyée:", logData);
  }

  // Méthode utilitaire pour ajouter un délai
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Nettoyer les anciens timestamps de cooldown
  cleanupCooldowns() {
    const now = Date.now();
    const expiredThreshold = now - this.cooldownPeriod * 2;

    for (const [siteId, timestamp] of this.lastAlerts.entries()) {
      if (timestamp < expiredThreshold) {
        this.lastAlerts.delete(siteId);
      }
    }
  }

  // Démarrer le nettoyage périodique
  startCleanupScheduler() {
    setInterval(() => {
      this.cleanupCooldowns();
    }, 30 * 60 * 1000); // Nettoyer toutes les 30 minutes
  }

  // Obtenir les statistiques du service
  getServiceStats() {
    return {
      queueLength: this.alertQueue.length,
      isProcessing: this.isProcessing,
      activeCooldowns: this.lastAlerts.size,
      cooldownPeriod: this.cooldownPeriod,
    };
  }

  // Tester l'envoi d'une alerte
  async testAlert(siteId, userEmail) {
    try {
      const site = await Website.findByPk(siteId, {
        include: ["company"],
      });

      if (!site) {
        throw new Error("Site non trouvé");
      }

      const testCheckResult = {
        website_id: site.id,
        status: "down",
        status_code: 500,
        response_time: 5000,
        error_message: "Test d'alerte - Erreur simulée",
        checked_at: new Date(),
      };

      const alertMessage = this.prepareAlertMessage(site, testCheckResult);

      await emailService.sendAlertEmail(userEmail, {
        ...alertMessage,
        subject: `[TEST] ${alertMessage.subject}`,
      });

      logger.info(`Alerte de test envoyée pour ${site.url} à ${userEmail}`);
      return true;
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'alerte de test:", error);
      throw error;
    }
  }
}

module.exports = new AlertService();
