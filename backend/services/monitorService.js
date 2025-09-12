// backend/services/monitorService.js
const axios = require("axios");
const https = require("https");
const tls = require("tls");
const { Website, WebsiteCheck, Incident } = require("../models");
const alertService = require("./alertService");
const logger = require("../utils/logger");

class MonitorService {
  constructor() {
    this.isRunning = false;
    this.checkQueue = new Map();
    this.maxConcurrentChecks = 50;
    this.currentChecks = 0;
  }

  // Démarrer le service de monitoring
  async startMonitoring() {
    if (this.isRunning) {
      logger.warn("Le service de monitoring est déjà en cours d'exécution");
      return;
    }

    this.isRunning = true;
    logger.info("Démarrage du service de monitoring");

    // Charger tous les sites actifs
    await this.loadActiveSites();

    // Démarrer le processus de vérification continue
    this.startCheckLoop();
  }

  // Arrêter le service de monitoring
  stopMonitoring() {
    this.isRunning = false;
    this.checkQueue.clear();
    logger.info("Service de monitoring arrêté");
  }

  // Charger tous les sites actifs à surveiller
  async loadActiveSites() {
    try {
      const sites = await Website.findAll({
        where: { is_active: true },
        include: ["company"],
      });

      logger.info(`${sites.length} sites chargés pour monitoring`);

      // Planifier les vérifications initiales
      for (const site of sites) {
        this.scheduleCheck(site);
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des sites:", error);
    }
  }

  // Planifier une vérification pour un site
  scheduleCheck(site, delay = 0) {
    const checkTime = Date.now() + (delay || site.check_interval * 1000);

    if (
      !this.checkQueue.has(site.id) ||
      this.checkQueue.get(site.id) > checkTime
    ) {
      this.checkQueue.set(site.id, checkTime);
    }
  }

  // Boucle principale de vérification
  startCheckLoop() {
    setInterval(async () => {
      if (!this.isRunning || this.currentChecks >= this.maxConcurrentChecks) {
        return;
      }

      const now = Date.now();
      const sitesToCheck = [];

      // Trouver les sites à vérifier maintenant
      for (const [siteId, checkTime] of this.checkQueue.entries()) {
        if (checkTime <= now && sitesToCheck.length < 10) {
          sitesToCheck.push(siteId);
          this.checkQueue.delete(siteId);
        }
      }

      // Lancer les vérifications
      for (const siteId of sitesToCheck) {
        this.performSiteCheck(siteId);
      }
    }, 5000); // Vérifier toutes les 5 secondes
  }

  // Effectuer la vérification d'un site
  async performSiteCheck(siteId) {
    this.currentChecks++;

    try {
      const site = await Website.findByPk(siteId, {
        include: ["company"],
      });

      if (!site || !site.is_active) {
        return;
      }

      logger.debug(`Vérification de ${site.url}`);

      const checkResult = await this.checkWebsite(site);
      await this.processCheckResult(site, checkResult);

      // Replanifier la prochaine vérification
      this.scheduleCheck(site);
    } catch (error) {
      logger.error(`Erreur lors de la vérification du site ${siteId}:`, error);
    } finally {
      this.currentChecks--;
    }
  }

  // Vérifier un site web
  async checkWebsite(site) {
    const startTime = Date.now();
    const result = {
      website_id: site.id,
      checked_at: new Date(),
      status: "down",
      response_time: null,
      status_code: null,
      error_message: null,
      ssl_valid: null,
      ssl_expires_at: null,
    };

    try {
      // Configuration axios avec timeout
      const axiosConfig = {
        timeout: site.timeout_threshold || 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Considérer 4xx comme "up" mais avec warning
        headers: {
          "User-Agent": "MonitorPro/1.0 Website Monitor",
        },
      };

      // Effectuer la requête HTTP
      const response = await axios.get(site.url, axiosConfig);
      const responseTime = Date.now() - startTime;

      result.response_time = responseTime;
      result.status_code = response.status;

      // Déterminer le statut
      if (response.status >= 200 && response.status < 300) {
        result.status = "up";
      } else if (response.status >= 400 && response.status < 500) {
        result.status = "warning";
        result.error_message = `Code HTTP ${response.status}`;
      } else {
        result.status = "down";
        result.error_message = `Code HTTP ${response.status}`;
      }

      // Vérifier SSL si activé
      if (site.ssl_check && site.url.startsWith("https://")) {
        const sslInfo = await this.checkSSL(site.url);
        result.ssl_valid = sslInfo.valid;
        result.ssl_expires_at = sslInfo.expires_at;

        // Ajouter warning si SSL expire bientôt (< 30 jours)
        if (sslInfo.valid && sslInfo.days_until_expiry < 30) {
          if (result.status === "up") {
            result.status = "warning";
            result.error_message = `SSL expire dans ${sslInfo.days_until_expiry} jours`;
          }
        }
      }
    } catch (error) {
      result.response_time = Date.now() - startTime;
      result.status = "down";

      if (error.code === "ECONNREFUSED") {
        result.error_message = "Connexion refusée";
      } else if (error.code === "ENOTFOUND") {
        result.error_message = "Domaine introuvable";
      } else if (error.code === "ETIMEDOUT") {
        result.error_message = "Timeout de connexion";
      } else if (error.response) {
        result.status_code = error.response.status;
        result.error_message = `Erreur HTTP ${error.response.status}`;
      } else {
        result.error_message = error.message || "Erreur inconnue";
      }
    }

    return result;
  }

  // Vérifier le certificat SSL
  async checkSSL(url) {
    return new Promise((resolve) => {
      try {
        const urlObj = new URL(url);
        const options = {
          host: urlObj.hostname,
          port: urlObj.port || 443,
          method: "GET",
          rejectUnauthorized: false,
        };

        const req = https.request(options, (res) => {
          const cert = res.connection.getPeerCertificate();

          if (cert && cert.valid_to) {
            const expiryDate = new Date(cert.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.floor(
              (expiryDate - now) / (1000 * 60 * 60 * 24)
            );

            resolve({
              valid: expiryDate > now,
              expires_at: expiryDate,
              days_until_expiry: daysUntilExpiry,
            });
          } else {
            resolve({ valid: false, expires_at: null, days_until_expiry: 0 });
          }
        });

        req.on("error", () => {
          resolve({ valid: false, expires_at: null, days_until_expiry: 0 });
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve({ valid: false, expires_at: null, days_until_expiry: 0 });
        });

        req.end();
      } catch (error) {
        resolve({ valid: false, expires_at: null, days_until_expiry: 0 });
      }
    });
  }

  // Traiter le résultat d'une vérification
  async processCheckResult(site, checkResult) {
    try {
      // Sauvegarder le résultat du check
      await WebsiteCheck.create(checkResult);

      // Obtenir le statut précédent
      const previousStatus = site.status;

      // Mettre à jour le statut du site si nécessaire
      if (site.status !== checkResult.status) {
        await site.update({ status: checkResult.status });

        logger.info(
          `Statut changé pour ${site.url}: ${previousStatus} → ${checkResult.status}`
        );

        // Gérer les incidents
        await this.handleStatusChange(
          site,
          previousStatus,
          checkResult.status,
          checkResult
        );
      }

      // Envoyer les alertes si nécessaire
      if (this.shouldSendAlert(previousStatus, checkResult.status)) {
        await alertService.sendAlert(site, checkResult);
      }
    } catch (error) {
      logger.error("Erreur lors du traitement du résultat:", error);
    }
  }

  // Gérer les changements de statut et incidents
  async handleStatusChange(site, previousStatus, newStatus, checkResult) {
    try {
      if (newStatus === "down" || newStatus === "warning") {
        // Vérifier s'il y a déjà un incident ouvert
        const openIncident = await Incident.findOne({
          where: {
            website_id: site.id,
            status: "open",
          },
        });

        if (!openIncident) {
          // Créer un nouvel incident
          const severity = newStatus === "down" ? "high" : "medium";
          await Incident.create({
            website_id: site.id,
            severity: severity,
            description: checkResult.error_message || `Site ${newStatus}`,
            started_at: new Date(),
          });

          logger.info(`Nouvel incident créé pour ${site.url}: ${severity}`);
        }
      } else if (
        newStatus === "up" &&
        (previousStatus === "down" || previousStatus === "warning")
      ) {
        // Résoudre les incidents ouverts
        await Incident.update(
          {
            status: "resolved",
            resolved_at: new Date(),
          },
          {
            where: {
              website_id: site.id,
              status: "open",
            },
          }
        );

        logger.info(`Incidents résolus pour ${site.url}`);
      }
    } catch (error) {
      logger.error("Erreur lors de la gestion des incidents:", error);
    }
  }

  // Déterminer si une alerte doit être envoyée
  shouldSendAlert(previousStatus, newStatus) {
    // Envoyer alerte lors de passage en down ou warning
    if (
      (previousStatus === "up" && newStatus === "down") ||
      (previousStatus === "up" && newStatus === "warning") ||
      (previousStatus === "warning" && newStatus === "down")
    ) {
      return true;
    }

    // Envoyer alerte lors de récupération
    if (
      (previousStatus === "down" && newStatus === "up") ||
      (previousStatus === "warning" && newStatus === "up")
    ) {
      return true;
    }

    return false;
  }

  // Ajouter un nouveau site au monitoring
  async addSiteToMonitoring(siteId) {
    try {
      const site = await Website.findByPk(siteId, {
        include: ["company"],
      });

      if (site && site.is_active) {
        this.scheduleCheck(site, 10000); // Première vérification dans 10 secondes
        logger.info(`Site ${site.url} ajouté au monitoring`);
      }
    } catch (error) {
      logger.error("Erreur lors de l'ajout du site au monitoring:", error);
    }
  }

  // Retirer un site du monitoring
  removeSiteFromMonitoring(siteId) {
    this.checkQueue.delete(siteId);
    logger.info(`Site ${siteId} retiré du monitoring`);
  }

  // Obtenir les statistiques du service
  getServiceStats() {
    return {
      isRunning: this.isRunning,
      sitesInQueue: this.checkQueue.size,
      currentChecks: this.currentChecks,
      maxConcurrentChecks: this.maxConcurrentChecks,
    };
  }
}

module.exports = new MonitorService();
