// backend/services/emailService.js (version corrigée)
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

      // ✅ CORRECTION: createTransport (pas createTransporter)
      this.transporter = nodemailer.createTransport(smtpConfig);

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

  // ✅ NOUVELLE FONCTION: Email de bienvenue
  async sendWelcomeEmail(recipientEmail, welcomeData) {
    if (!this.isConfigured) {
      logger.warn(
        "Service email non configuré - email de bienvenue non envoyé"
      );
      return false;
    }

    try {
      const htmlContent = this.generateWelcomeEmailHTML(welcomeData);
      const textContent = this.generateWelcomeEmailText(welcomeData);

      const mailOptions = {
        from: `"MonitorPro" <${
          process.env.SMTP_FROM || process.env.SMTP_USER
        }>`,
        to: recipientEmail,
        subject: `🎉 Bienvenue sur MonitorPro, ${welcomeData.firstName} !`,
        text: textContent,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(
        `Email de bienvenue envoyé à ${recipientEmail} (${result.messageId})`
      );
      return true;
    } catch (error) {
      logger.error(
        `Erreur lors de l'envoi de l'email de bienvenue à ${recipientEmail}:`,
        error
      );
      return false;
    }
  }

  // Générer le contenu HTML de l'email de bienvenue
  generateWelcomeEmailHTML(welcomeData) {
    const { firstName, companyName, loginUrl, selectedPlan } = welcomeData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur MonitorPro</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f4f4f4; 
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff; 
                border-radius: 8px; 
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #800020 0%, #a6002b 100%); 
                color: white; 
                padding: 40px 20px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0 0 10px 0; 
                font-size: 28px; 
                font-weight: 700; 
            }
            .header p { 
                margin: 0; 
                font-size: 16px; 
                opacity: 0.9; 
            }
            .content { 
                padding: 40px 20px; 
            }
            .welcome-box { 
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                border-radius: 8px; 
                padding: 30px; 
                margin: 20px 0; 
                text-align: center; 
            }
            .plan-badge { 
                display: inline-block; 
                background: #800020; 
                color: white; 
                padding: 8px 16px; 
                border-radius: 20px; 
                font-weight: bold; 
                font-size: 14px; 
                margin: 10px 0; 
            }
            .btn { 
                display: inline-block; 
                background: linear-gradient(135deg, #800020 0%, #a6002b 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold; 
                margin: 20px 0; 
                box-shadow: 0 4px 6px rgba(128, 0, 32, 0.3);
                transition: all 0.3s ease;
            }
            .features { 
                margin: 30px 0; 
            }
            .feature { 
                display: flex; 
                align-items: center; 
                margin: 15px 0; 
                padding: 15px; 
                background: #f8f9fa; 
                border-radius: 6px; 
            }
            .feature-icon { 
                width: 40px; 
                height: 40px; 
                background: #800020; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                margin-right: 15px; 
                font-size: 20px; 
            }
            .footer { 
                background-color: #f8f9fa; 
                padding: 30px 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #666; 
            }
            .social-links { 
                margin: 20px 0; 
            }
            .social-links a { 
                display: inline-block; 
                margin: 0 10px; 
                color: #800020; 
                text-decoration: none; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Bienvenue sur MonitorPro !</h1>
                <p>Votre compte a été créé avec succès</p>
            </div>
            
            <div class="content">
                <div class="welcome-box">
                    <h2 style="color: #800020; margin-top: 0;">Bonjour ${firstName} !</h2>
                    <p>Félicitations ! Votre compte MonitorPro pour <strong>${companyName}</strong> est maintenant actif.</p>
                    <div class="plan-badge">${selectedPlan.toUpperCase()}</div>
                    <p style="margin-bottom: 0;">Vous pouvez commencer à surveiller vos sites web dès maintenant !</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" class="btn">🚀 Accéder à mon tableau de bord</a>
                </div>

                <div class="features">
                    <h3 style="color: #800020;">Que pouvez-vous faire maintenant ?</h3>
                    
                    <div class="feature">
                        <div class="feature-icon">🌐</div>
                        <div>
                            <strong>Ajouter vos sites web</strong><br>
                            Commencez par ajouter vos premiers sites à surveiller
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">⚡</div>
                        <div>
                            <strong>Configuration automatique</strong><br>
                            Le monitoring démarre automatiquement après ajout
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">📧</div>
                        <div>
                            <strong>Alertes instantanées</strong><br>
                            Recevez des notifications en cas de panne détectée
                        </div>
                    </div>
                    
                    <div class="feature">
                        <div class="feature-icon">👥</div>
                        <div>
                            <strong>Inviter votre équipe</strong><br>
                            Ajoutez d'autres utilisateurs à votre compte
                        </div>
                    </div>
                </div>

                <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h4 style="color: #2e7d32; margin-top: 0;">🎁 Essai gratuit de 14 jours</h4>
                    <p style="margin-bottom: 0; color: #2e7d32;">
                        Profitez de toutes les fonctionnalités sans limitation pendant votre période d'essai. 
                        Aucune carte bancaire n'est requise.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Besoin d'aide ?</strong></p>
                <p>
                    Consultez notre <a href="#" style="color: #800020;">documentation</a> ou 
                    contactez-nous à <a href="mailto:support@monitorpro.com" style="color: #800020;">support@monitorpro.com</a>
                </p>
                
                <div class="social-links">
                    <a href="#">Twitter</a> | 
                    <a href="#">LinkedIn</a> | 
                    <a href="#">Documentation</a>
                </div>
                
                <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    MonitorPro - Surveillance de sites web 24/7<br>
                    Cet email a été envoyé automatiquement. Ne pas répondre à cette adresse.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Générer le contenu texte de l'email de bienvenue
  generateWelcomeEmailText(welcomeData) {
    const { firstName, companyName, loginUrl, selectedPlan } = welcomeData;

    return `
🎉 Bienvenue sur MonitorPro !

Bonjour ${firstName},

Félicitations ! Votre compte MonitorPro pour ${companyName} est maintenant actif.
Plan sélectionné : ${selectedPlan.toUpperCase()}

🚀 ACCÉDER À VOTRE TABLEAU DE BORD :
${loginUrl}

QUE POUVEZ-VOUS FAIRE MAINTENANT ?

🌐 Ajouter vos sites web
   Commencez par ajouter vos premiers sites à surveiller

⚡ Configuration automatique  
   Le monitoring démarre automatiquement après ajout

📧 Alertes instantanées
   Recevez des notifications en cas de panne détectée

👥 Inviter votre équipe
   Ajoutez d'autres utilisateurs à votre compte

🎁 ESSAI GRATUIT DE 14 JOURS
Profitez de toutes les fonctionnalités sans limitation pendant votre période d'essai.
Aucune carte bancaire n'est requise.

BESOIN D'AIDE ?
- Documentation : https://docs.monitorpro.com
- Support : support@monitorpro.com

--
MonitorPro - Surveillance de sites web 24/7
Cet email a été envoyé automatiquement.
    `;
  }

  // Envoyer un email d'alerte (fonction existante corrigée)
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

  // Générer le contenu HTML de l'email d'alerte (fonction existante)
  generateAlertEmailHTML(alertData) {
    const { site, status, timestamp } = alertData;

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
            .btn { display: inline-block; padding: 12px 24px; background-color: #800020; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
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
                </div>

                <div class="details">
                    <h3>Détails de l'incident</h3>
                    <table>
                        <tr>
                            <th>Statut</th>
                            <td>${status.text}</td>
                        </tr>
                        <tr>
                            <th>Code de réponse</th>
                            <td>${status.code || "N/A"}</td>
                        </tr>
                        <tr>
                            <th>Temps de réponse</th>
                            <td>${
                              status.responseTime
                                ? status.responseTime + "ms"
                                : "N/A"
                            }</td>
                        </tr>
                        <tr>
                            <th>Timestamp</th>
                            <td>${new Date(timestamp).toLocaleString(
                              "fr-FR"
                            )}</td>
                        </tr>
                        ${
                          status.error
                            ? `
                        <tr>
                            <th>Erreur</th>
                            <td>${status.error}</td>
                        </tr>
                        `
                            : ""
                        }
                    </table>
                </div>

                ${
                  alertData.dashboardUrl
                    ? `
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${alertData.dashboardUrl}" class="btn">Voir le Dashboard</a>
                </div>
                `
                    : ""
                }
            </div>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement par MonitorPro.</p>
                <p>Surveillez vos sites web 24/7 - <a href="${
                  alertData.dashboardUrl || "#"
                }">monitorpro.com</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Générer le contenu texte de l'email d'alerte (fonction existante)
  generateAlertEmailText(alertData) {
    const { site, status, timestamp } = alertData;

    let text = `ALERTE MONITORPRO\n\n`;
    text += `${status.icon} ${status.text}\n\n`;
    text += `Site: ${site.name}\n`;
    text += `URL: ${site.url}\n`;

    if (site.client) {
      text += `Client: ${site.client}\n`;
    }

    text += `\nDÉTAILS:\n`;
    text += `- Code de réponse: ${status.code || "N/A"}\n`;
    text += `- Temps de réponse: ${
      status.responseTime ? status.responseTime + "ms" : "N/A"
    }\n`;
    text += `- Timestamp: ${new Date(timestamp).toLocaleString("fr-FR")}\n`;

    if (status.error) {
      text += `- Erreur: ${status.error}\n`;
    }

    if (alertData.dashboardUrl) {
      text += `\nDashboard: ${alertData.dashboardUrl}\n`;
    }

    text += `\n--\nCet email a été envoyé automatiquement par MonitorPro.\n`;
    return text;
  }

  // Envoyer un email de test
  async sendTestEmail(testEmail) {
    if (!this.isConfigured) {
      throw new Error("Service email non configuré");
    }

    try {
      const testMailOptions = {
        from: `"MonitorPro Test" <${
          process.env.SMTP_FROM || process.env.SMTP_USER
        }>`,
        to: testEmail,
        subject: "Test de configuration MonitorPro",
        text: `Test de configuration MonitorPro\n\nSi vous recevez cet email, la configuration SMTP fonctionne correctement.\nDate: ${new Date().toLocaleString(
          "fr-FR"
        )}`,
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
