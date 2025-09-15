// backend/routes/public.js (version avec email de bienvenue)
const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Company = require("../models/Company");
const logger = require("../utils/logger");
const emailService = require("../services/emailService"); // ✅ Import ajouté

const router = express.Router();

// POST /api/public/signup - Inscription nouvelle entreprise
router.post(
  "/signup",
  [
    body("companyName").isLength({ min: 1, max: 255 }).trim(),
    body("industry").isLength({ min: 1, max: 100 }).trim(),
    body("companySize").isLength({ min: 1, max: 50 }).trim(),
    body("selectedPlan").isIn(["starter", "professional", "enterprise"]),
    body("adminEmail").isEmail().normalizeEmail(),
    body("adminPassword").isLength({ min: 8 }),
    body("adminFirstName").isLength({ min: 1, max: 100 }).trim(),
    body("adminLastName").isLength({ min: 1, max: 100 }).trim(),
    body("acceptTerms").isBoolean().equals("true"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const {
        companyName,
        industry,
        companySize,
        selectedPlan,
        adminEmail,
        adminPassword,
        adminFirstName,
        adminLastName,
      } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ where: { email: adminEmail } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Un compte avec cet email existe déjà",
        });
      }

      // Définir les limites selon le plan
      const planLimits = {
        starter: { max_sites: 10, price: 19 },
        professional: { max_sites: 50, price: 49 },
        enterprise: { max_sites: 200, price: 149 },
      };

      // Créer l'entreprise
      const company = await Company.create({
        name: companyName,
        slug: companyName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        subscription_plan: selectedPlan,
        max_sites: planLimits[selectedPlan].max_sites,
        // Si votre modèle Company supporte ces champs :
        // industry,
        // company_size: companySize,
      });

      // Créer le compte admin
      const passwordHash = await User.hashPassword(adminPassword);
      const adminUser = await User.create({
        email: adminEmail,
        password_hash: passwordHash,
        first_name: adminFirstName,
        last_name: adminLastName,
        role: "admin",
        company_id: company.id,
        is_active: true,
        email_verified: true,
      });

      // ✅ Envoyer l'email de bienvenue
      try {
        await emailService.sendWelcomeEmail(adminEmail, {
          firstName: adminFirstName,
          companyName: companyName,
          selectedPlan: selectedPlan,
          loginUrl: `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login`,
        });
        logger.info(`Email de bienvenue envoyé à ${adminEmail}`);
      } catch (emailError) {
        // Ne pas faire échouer l'inscription si l'email échoue
        logger.warn(
          `Échec envoi email de bienvenue à ${adminEmail}:`,
          emailError.message
        );
      }

      logger.info(
        `Nouvelle entreprise créée: ${companyName} (${adminEmail}) - Plan: ${selectedPlan}`
      );

      res.status(201).json({
        success: true,
        message: "Compte créé avec succès",
        data: {
          company: {
            id: company.id,
            name: company.name,
            plan: company.subscription_plan,
            max_sites: company.max_sites,
          },
          user: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.getFullName(),
            role: adminUser.role,
          },
        },
      });
    } catch (error) {
      logger.error("Erreur création compte:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création du compte",
      });
    }
  }
);

// GET /api/public/plans - Liste des plans disponibles
router.get("/plans", (req, res) => {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 19,
      maxSites: 10,
      features: [
        "Jusqu'à 10 sites web",
        "Vérifications toutes les 5 min",
        "Alertes email",
        "1 utilisateur",
        "Support email",
      ],
      recommended: false,
    },
    {
      id: "professional",
      name: "Professional",
      price: 49,
      maxSites: 50,
      features: [
        "Jusqu'à 50 sites web",
        "Vérifications toutes les 1 min",
        "Alertes email + SMS",
        "5 utilisateurs",
        "Rapports avancés",
        "Support prioritaire",
      ],
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 149,
      maxSites: 200,
      features: [
        "Jusqu'à 200 sites web",
        "Vérifications en temps réel",
        "Alertes multi-canaux",
        "Utilisateurs illimités",
        "API complète",
        "Support dédié",
      ],
      recommended: false,
    },
  ];

  res.json({
    success: true,
    data: plans,
  });
});

// POST /api/public/contact - Formulaire de contact
router.post(
  "/contact",
  [
    body("name").isLength({ min: 1, max: 100 }).trim(),
    body("email").isEmail().normalizeEmail(),
    body("company").optional().isLength({ max: 255 }).trim(),
    body("message").isLength({ min: 10, max: 1000 }).trim(),
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

      const { name, email, company, message } = req.body;

      logger.info("Nouveau message de contact", {
        name,
        email,
        company,
        messageLength: message.length,
      });

      // TODO: Envoyer email à l'équipe support
      // TODO: Sauvegarder en base si besoin

      res.json({
        success: true,
        message:
          "Merci pour votre message ! Nous vous contacterons rapidement.",
      });
    } catch (error) {
      logger.error("Erreur formulaire contact:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi du message",
      });
    }
  }
);

// GET /api/public/health - Health check public
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// POST /api/public/test-email - Test de configuration email (dev uniquement)
router.post("/test-email", async (req, res) => {
  // Seulement en développement
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      message: "Endpoint non disponible en production",
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis",
      });
    }

    const result = await emailService.sendTestEmail(email);

    res.json({
      success: true,
      message: "Email de test envoyé avec succès",
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error("Erreur test email:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email de test",
      error: error.message,
    });
  }
});

// GET /api/public/email-status - Statut du service email
router.get("/email-status", (req, res) => {
  const status = emailService.getServiceStatus();

  res.json({
    success: true,
    data: status,
  });
});

module.exports = router;
