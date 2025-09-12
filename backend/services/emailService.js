// backend/services/emailService.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  // Initialiser le service email
  init() {
    try {
      // Configuration SMTP
      const smtpConfig = {
        host: process.env.SMTP_HOST || "localhost",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true", // true pour 465, false pour autres ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      // Créer le transporteur
      this.transporter = nodemailer.createTransporter(smtpConfig);

      // Vérifier la configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error("Configuration SMTP invalide:", error);
          this.isConfigured = false;
        } else {
          logger.info("Service email configuré avec succès");
          this.isConfigured = true;
        }
      });
    } catch (error) {
      logger.error("Erreur lors de l'initialisation du service email:", error);
      this.isConfigured = false;
    }
  }

  // Envoyer un email d'alerte
  async sendAlertEmail(recipientEmail, alertData) {
    if (!this.isConfigured) {
      logger.warn("Service email non configuré - alerte non envoyée");
      return false;
    }

    try {
      const htmlContent = this.generateAlertEmailHTML(alertData);
      const textContent = this.generateAlertEmailText(alertData);

      const mailOptions = {
        from: `"MonitorPro" <${
          process.env.SMTP_FROM || process.env.SMTP_USER
        }>`,
        to: recipientEmail,
        subject: alertData.subject,
        text: textContent,
        html: htmlContent,
        priority: alertData.priority === "high" ? "high" : "normal",
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(
        `Email d'alerte envoyé à ${recipientEmail} (${result.messageId})`
      );
      return true;
    } catch (error) {
      logger.error(
        `Erreur lors de l'envoi de l'email à ${recipientEmail}:`,
        error
      );
      return false;
    }
  }

  // Générer le contenu HTML de l'email d'alerte
  generateAlertEmailHTML(alertData) {
    const { site, status, timestamp } = alertData;

    // Couleurs selon le statut
    const colors = {
      up: "#10B981",
      down: "#EF4444",
      warning: "#F59E0B",
    };

    const statusColor = colors[status.code] || "#6B7280";

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerte MonitorPro</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .site-info { background-color: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 15px; margin: 15px 0; }
            .details { margin: 20px 0; }
            .details table { width: 100%; border-collapse: collapse; }
            .details th, .details td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .details th { background-color: #f2f2f2; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; color: white; background-color: ${statusColor}; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${status.icon} MonitorPro - Alerte</h1>
                <p style="margin: 0; font-size: 18px;">${status.text}</p>
            </div>
            
            <div class="content">
                <div class="site-info">
                    <h2 style="margin-top: 0;">${site.name}</h2>
                    <p><strong>URL:</strong> <a href="${
                      site.url
                    }" target="_blank">${site.url}</a></p>
                    ${
                      site.client
                        ? `<p><strong>Client:</strong> ${site.client}</p>`
                        : ""
                    }
                    <p><strong>Statut:</strong> <span class="status-badge">${
                      status.text
                    }</span></p>
                </div>

                <div class="details">
                    <h3>Détails de la vérification</h3>
                    <table>
                        <tr>
                            <th>Heure de vérification</th>
                            <td>${new Date(timestamp).toLocaleString(
                              "fr-FR"
                            )}</td>
                        </tr>
                        ${
                          status.code
                            ? `
                        <tr>
                            <th>Code de réponse</th>
                            <td>${status.code}</td>
                        </tr>`
                            : ""
                        }
                        ${
                          status.responseTime
                            ? `
                        <tr>
                            <th>Temps de réponse</th>
                            <td>${status.responseTime}ms</td>
                        </tr>`
                            : ""
                        }
                        ${
                          status.error
                            ? `
                        <tr>
                            <th>Erreur</th>
                            <td style="color: #EF4444;">${status.error}</td>
                        </tr>`
                            : ""
                        }
                    </table>
                </div>

                ${
                  alertData.dashboardUrl
                    ? `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${alertData.dashboardUrl}" class="btn">Voir le Dashboard</a>
                </div>`
                    : ""
                }

                <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 4px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Action recommandée:</strong></p>
                    <p style="margin: 5px 0;">
                        ${
                          status.code === "down"
                            ? "Vérifiez immédiatement l'état du serveur et des services."
                            : status.code === "warning"
                            ? "Surveillez le site de près et vérifiez les logs si disponibles."
                            : "Le site est de nouveau opérationnel. Continuez la surveillance."
                        }
                    </p>
                </div>
            </div>

            <div class="footer">
                <p>Cet email a été envoyé automatiquement par MonitorPro.</p>
                <p>Pour modifier vos préférences de notification, connectez-vous à votre dashboard.</p>
                <p style="font-size: 12px; color: #999;">© 2024 MonitorPro - Système de surveillance de sites web</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Générer le contenu texte de l'email d'alerte
  generateAlertEmailText(alertData) {
    const { site, status, timestamp } = alertData;

    let text = `MonitorPro - Alerte\n`;
    text += `========================\n\n`;
    text += `${status.icon} ${status.text}\n\n`;
    text += `Site: ${site.name}\n`;
    text += `URL: ${site.url}\n`;
    if (site.client) text += `Client: ${site.client}\n`;
    text += `Statut: ${status.text}\n`;
    text += `Heure: ${new Date(timestamp).toLocaleString("fr-FR")}\n\n`;

    if (status.code) text += `Code de réponse: ${status.code}\n`;
    if (status.responseTime)
      text += `Temps de réponse: ${status.responseTime}ms\n`;
    if (status.error) text += `Erreur: ${status.error}\n`;

    text += `\nAction recommandée:\n`;
    if (status.code === "down") {
      text += `Vérifiez immédiatement l'état du serveur et des services.\n`;
    } else if (status.code === "warning") {
      text += `Surveillez le site de près et vérifiez les logs si disponibles.\n`;
    } else {
      text += `Le site est de nouveau opérationnel. Continuez la surveillance.\n`;
    }

    if (alertData.dashboardUrl) {
      text += `\nDashboard: ${alertData.dashboardUrl}\n`;
    }

    text += `\n--\n`;
    text += `Cet email a été envoyé automatiquement par MonitorPro.\n`;

    return text;
  }

  // Envoyer un rapport par email
  async sendReportEmail(recipientEmail, reportData) {
    if (!this.isConfigured) {
      logger.warn("Service email non configuré - rapport non envoyé");
      return false;
    }

    try {
      const htmlContent = this.generateReportEmailHTML(reportData);
      const textContent = this.generateReportEmailText(reportData);

      const mailOptions = {
        from: `"MonitorPro" <${
          process.env.SMTP_FROM || process.env.SMTP_USER
        }>`,
        to: recipientEmail,
        subject: `Rapport MonitorPro - ${reportData.period}`,
        text: textContent,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Rapport envoyé à ${recipientEmail} (${result.messageId})`);
      return true;
    } catch (error) {
      logger.error(
        `Erreur lors de l'envoi du rapport à ${recipientEmail}:`,
        error
      );
      return false;
    }
  }

  // Générer le contenu HTML du rapport
  generateReportEmailHTML(reportData) {
    const { period, sites, summary } = reportData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport MonitorPro</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
            .stat-card { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #3B82F6; }
            .stat-number { font-size: 24px; font-weight: bold; color: #3B82F6; }
            .sites-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .sites-table th, .sites-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .sites-table th { background-color: #f2f2f2; font-weight: bold; }
            .status-good { color: #10B981; font-weight: bold; }
            .status-warning { color: #F59E0B; font-weight: bold; }
            .status-bad { color: #EF4444; font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Rapport MonitorPro</h1>
                <p style="margin: 0;">Période: ${period}</p>
            </div>
            
            <div class="content">
                <div class="summary">
                    <div class="stat-card">
                        <div class="stat-number">${summary.totalSites}</div>
                        <div>Sites surveillés</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${summary.totalChecks}</div>
                        <div>Vérifications</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${summary.avgUptime}%</div>
                        <div>Disponibilité moyenne</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${summary.totalIncidents}</div>
                        <div>Incidents</div>
                    </div>
                </div>

                <h2>Détail par site</h2>
                <table class="sites-table">
                    <thead>
                        <tr>
                            <th>Site</th>
                            <th>Disponibilité</th>
                            <th>Temps de réponse</th>
                            <th>Incidents</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sites
                          .map(
                            (site) => `
                        <tr>
                            <td>
                                <strong>${site.name}</strong><br>
                                <small>${site.url}</small>
                            </td>
                            <td class="${
                              site.uptime >= 99
                                ? "status-good"
                                : site.uptime >= 95
                                ? "status-warning"
                                : "status-bad"
                            }">
                                ${site.uptime}%
                            </td>
                            <td>${site.avgResponseTime}ms</td>
                            <td>${site.incidents}</td>
                        </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>Rapport généré automatiquement le ${new Date().toLocaleString(
                  "fr-FR"
                )}</p>
                <p>© 2024 MonitorPro - Système de surveillance de sites web</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Générer le contenu texte du rapport
  generateReportEmailText(reportData) {
    const { period, sites, summary } = reportData;

    let text = `MonitorPro - Rapport ${period}\n`;
    text += `===============================\n\n`;
    text += `Résumé:\n`;
    text += `- Sites surveillés: ${summary.totalSites}\n`;
    text += `- Vérifications: ${summary.totalChecks}\n`;
    text += `- Disponibilité moyenne: ${summary.avgUptime}%\n`;
    text += `- Incidents: ${summary.totalIncidents}\n\n`;

    text += `Détail par site:\n`;
    text += `----------------\n`;

    sites.forEach((site) => {
      text += `${site.name} (${site.url})\n`;
      text += `  Disponibilité: ${site.uptime}%\n`;
      text += `  Temps de réponse: ${site.avgResponseTime}ms\n`;
      text += `  Incidents: ${site.incidents}\n\n`;
    });

    text += `--\n`;
    text += `Rapport généré le ${new Date().toLocaleString("fr-FR")}\n`;
    text += `MonitorPro - Système de surveillance de sites web\n`;

    return text;
  }

  // Tester la configuration email
  async testEmailConfiguration(testEmail) {
    if (!this.isConfigured) {
      throw new Error("Service email non configuré");
    }

    try {
      const testMailOptions = {
        from: `"MonitorPro" <${
          process.env.SMTP_FROM || process.env.SMTP_USER
        }>`,
        to: testEmail,
        subject: "Test de configuration MonitorPro",
        text: "Ceci est un test de configuration du service email MonitorPro.",
        html: `
        <h2>Test de configuration MonitorPro</h2>
        <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString("fr-FR")}</p>
        `,
      };

      const result = await this.transporter.sendMail(testMailOptions);
      logger.info(`Email de test envoyé à ${testEmail} (${result.messageId})`);
      return result;
    } catch (error) {
      logger.error("Erreur lors du test email:", error);
      throw error;
    }
  }

  // Obtenir le statut du service
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER ? "***" : null,
    };
  }
}

module.exports = new EmailService();
