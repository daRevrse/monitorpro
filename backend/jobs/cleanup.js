const { WebsiteCheck, UserSession, Incident } = require("../models");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

class CleanupService {
  // Nettoyer les anciens checks (garder données récentes)
  async cleanupOldChecks(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Supprimer les checks de plus de X jours (garder 1 sur 10)
      const oldChecks = await WebsiteCheck.findAll({
        where: {
          checked_at: { [Op.lt]: cutoffDate },
        },
        order: [["checked_at", "ASC"]],
      });

      let deletedCount = 0;
      for (let i = 0; i < oldChecks.length; i++) {
        // Garder 1 check sur 10 pour les statistiques historiques
        if (i % 10 !== 0) {
          await oldChecks[i].destroy();
          deletedCount++;
        }
      }

      logger.info(`Nettoyage: ${deletedCount} anciens checks supprimés`);
      return deletedCount;
    } catch (error) {
      logger.error("Erreur nettoyage checks:", error);
      throw error;
    }
  }

  // Nettoyer les sessions expirées
  async cleanupExpiredSessions() {
    try {
      const deletedCount = await UserSession.destroy({
        where: {
          [Op.or]: [
            { expires_at: { [Op.lt]: new Date() } },
            { is_active: false },
          ],
        },
      });

      if (deletedCount > 0) {
        logger.info(`${deletedCount} sessions expirées supprimées`);
      }

      return deletedCount;
    } catch (error) {
      logger.error("Erreur nettoyage sessions:", error);
      throw error;
    }
  }

  // Fermer automatiquement les vieux incidents
  async autoCloseOldIncidents(daysOpen = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOpen);

      const [updatedCount] = await Incident.update(
        {
          status: "resolved",
          resolved_at: new Date(),
          description: `Incident fermé automatiquement après ${daysOpen} jours`,
        },
        {
          where: {
            status: "open",
            started_at: { [Op.lt]: cutoffDate },
          },
        }
      );

      if (updatedCount > 0) {
        logger.info(`${updatedCount} incidents fermés automatiquement`);
      }

      return updatedCount;
    } catch (error) {
      logger.error("Erreur fermeture incidents:", error);
      throw error;
    }
  }

  // Nettoyage complet quotidien
  async performDailyCleanup() {
    logger.info("Début du nettoyage quotidien");

    const results = {
      checks: await this.cleanupOldChecks(30),
      sessions: await this.cleanupExpiredSessions(),
      incidents: await this.autoCloseOldIncidents(7),
    };

    logger.info("Nettoyage quotidien terminé:", results);
    return results;
  }
}

module.exports = new CleanupService();
