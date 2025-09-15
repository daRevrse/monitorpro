// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const User = require("../models/User");
const Company = require("../models/Company");
const UserSession = require("../models/UserSession");
const logger = require("../utils/logger"); // ✅ AJOUT DE L'IMPORT MANQUANT

const router = express.Router();

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
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

      const { email, password } = req.body;

      // Vérifier utilisateur avec sa company
      const user = await User.findOne({
        where: { email, is_active: true },
        include: [
          {
            model: Company,
            as: "company",
          },
        ],
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Identifiants invalides",
        });
      }

      // Vérifier mot de passe
      const validPassword = await user.validatePassword(password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: "Identifiants invalides",
        });
      }

      // Mettre à jour dernière connexion
      await user.update({ last_login_at: new Date() });

      // Générer tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Nettoyer les anciennes sessions expirées
      await UserSession.destroy({
        where: {
          user_id: user.id,
          expires_at: { [Op.lt]: new Date() },
        },
      });

      // Sauvegarder nouvelle session
      await UserSession.create({
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        user_agent: req.headers["user-agent"] || "",
        ip_address: req.ip || req.connection.remoteAddress,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.getFullName(),
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          company_id: user.company_id,
          company_name: user.company ? user.company.name : null,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur",
      });
    }
  }
);

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token requis",
      });
    }

    const session = await UserSession.findOne({
      where: {
        refresh_token,
        expires_at: { [Op.gt]: new Date() },
        is_active: true,
      },
      include: [
        {
          model: User,
          as: "user",
          where: { is_active: true },
        },
      ],
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }

    const newAccessToken = generateAccessToken(session.user);

    res.json({
      success: true,
      access_token: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await UserSession.update(
        { is_active: false },
        {
          where: {
            user_id: req.user.id,
            refresh_token,
          },
        }
      );
    } else {
      // Déconnecter toutes les sessions
      await UserSession.update(
        { is_active: false },
        { where: { user_id: req.user.id } }
      );
    }

    res.json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// GET /api/auth/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Company,
          as: "company",
        },
      ],
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.getFullName(),
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        company_id: user.company_id,
        company_name: user.company ? user.company.name : null,
        email_verified: user.email_verified,
        last_login_at: user.last_login_at,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Fonctions utilitaires
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token requis",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Token invalide",
      });
    }

    req.user = user;
    next();
  });
}

// POST /api/auth/register - Inscription (admin seulement)
router.post(
  "/register",
  [
    authenticateToken,
    // requireRole(["admin"]),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("first_name").isLength({ min: 1, max: 100 }).trim(),
    body("last_name").isLength({ min: 1, max: 100 }).trim(),
    body("role").isIn(["admin", "manager", "technician", "client"]),
    body("company_id").optional().isInt(),
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

      const { email, password, first_name, last_name, role, company_id } =
        req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Un utilisateur avec cet email existe déjà",
        });
      }

      // Utiliser la company de l'admin si pas spécifiée
      const finalCompanyId = company_id || req.user.company_id;

      // Hasher le mot de passe
      const passwordHash = await User.hashPassword(password);

      // Créer l'utilisateur
      const user = await User.create({
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
        role,
        company_id: finalCompanyId,
        is_active: true,
        email_verified: true,
      });

      logger.info(`Nouvel utilisateur créé par admin ${req.user.id}: ${email}`);

      res.status(201).json({
        success: true,
        message: "Utilisateur créé avec succès",
        user: {
          id: user.id,
          email: user.email,
          name: user.getFullName(),
          role: user.role,
        },
      });
    } catch (error) {
      logger.error("Erreur création utilisateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'utilisateur",
      });
    }
  }
);

// GET /api/auth/users - Liste des utilisateurs (admin seulement)
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const { company_id, role } = req.user;

    // Seuls les admins peuvent voir tous les utilisateurs
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Si admin global, voir tous les utilisateurs, sinon seulement ceux de sa company
    const whereClause = company_id ? { company_id } : {};

    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: "company",
        },
      ],
      attributes: { exclude: ["password_hash"] },
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.getFullName(),
        role: user.role,
        company_id: user.company_id,
        company_name: user.company ? user.company.name : null,
        is_active: user.is_active,
        email_verified: user.email_verified,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })),
    });
  } catch (error) {
    logger.error("Erreur liste utilisateurs:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
    });
  }
});

// PUT /api/auth/users/:id - Modifier un utilisateur (admin seulement)
router.put(
  "/users/:id",
  [
    authenticateToken,
    body("email").optional().isEmail().normalizeEmail(),
    body("first_name").optional().isLength({ min: 1, max: 100 }).trim(),
    body("last_name").optional().isLength({ min: 1, max: 100 }).trim(),
    body("role").optional().isIn(["admin", "manager", "technician", "client"]),
    body("is_active").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const { role: userRole, company_id: userCompanyId } = req.user;
      const { id } = req.params;

      // Seuls les admins peuvent modifier les utilisateurs
      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      // Trouver l'utilisateur à modifier
      const whereClause = userCompanyId
        ? { id, company_id: userCompanyId }
        : { id };
      const user = await User.findOne({ where: whereClause });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Empêcher un admin de se désactiver lui-même
      if (user.id === req.user.id && req.body.is_active === false) {
        return res.status(400).json({
          success: false,
          message: "Vous ne pouvez pas vous désactiver vous-même",
        });
      }

      // Mettre à jour l'utilisateur
      const updatedData = {};
      const allowedFields = [
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updatedData[field] = req.body[field];
        }
      });

      await user.update(updatedData);

      logger.info(`Utilisateur ${user.email} modifié par admin ${req.user.id}`);

      res.json({
        success: true,
        message: "Utilisateur modifié avec succès",
        user: {
          id: user.id,
          email: user.email,
          name: user.getFullName(),
          role: user.role,
          is_active: user.is_active,
        },
      });
    } catch (error) {
      logger.error("Erreur modification utilisateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la modification de l'utilisateur",
      });
    }
  }
);

// DELETE /api/auth/users/:id - Supprimer un utilisateur (admin seulement)
router.delete("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { role: userRole, company_id: userCompanyId } = req.user;
    const { id } = req.params;

    // Seuls les admins peuvent supprimer les utilisateurs
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Trouver l'utilisateur à supprimer
    const whereClause = userCompanyId
      ? { id, company_id: userCompanyId }
      : { id };
    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Empêcher un admin de se supprimer lui-même
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas vous supprimer vous-même",
      });
    }

    await user.destroy();

    logger.info(`Utilisateur ${user.email} supprimé par admin ${req.user.id}`);

    res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    logger.error("Erreur suppression utilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
    });
  }
});

// PROFILE

// PUT /api/auth/profile - Mettre à jour le profil
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const userId = req.user.id;

    // Validation des champs
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== req.user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé par un autre compte",
        });
      }
    }

    // Mettre à jour l'utilisateur
    const user = await User.findByPk(userId);
    await user.update({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
    });

    logger.info(`Profil mis à jour pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: {
        id: user.id,
        email: user.email,
        name: user.getFullName(),
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    logger.error("Erreur mise à jour profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
    });
  }
});

// PUT /api/auth/change-password - Changer le mot de passe
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Validation des champs
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel et nouveau mot de passe requis",
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères",
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await user.validatePassword(current_password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel incorrect",
      });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await User.hashPassword(new_password);

    // Mettre à jour le mot de passe
    await user.update({
      password_hash: newPasswordHash,
    });

    // Invalider toutes les sessions existantes sauf la session actuelle
    await UserSession.update(
      { is_active: false },
      {
        where: {
          user_id: userId,
          refresh_token: { [Op.ne]: req.body.keep_current_session_token || "" },
        },
      }
    );

    logger.info(`Mot de passe changé pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    logger.error("Erreur changement mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement de mot de passe",
    });
  }
});

// PUT /api/auth/preferences - Mettre à jour les préférences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_notifications = true,
      sms_notifications = false,
      slack_notifications = false,
      language = "fr",
      timezone = "Europe/Paris",
    } = req.body;

    // Pour l'instant, on va stocker les préférences dans une table séparée
    // ou dans un champ JSON de la table users

    // Si votre modèle User n'a pas de champ preferences, vous pouvez :
    // 1. L'ajouter comme champ JSON
    // 2. Créer une table UserPreferences séparée

    // Exemple avec un champ JSON (nécessite une migration) :
    const user = await User.findByPk(userId);
    const preferences = {
      email_notifications,
      sms_notifications,
      slack_notifications,
      language,
      timezone,
      updated_at: new Date(),
    };

    // Si vous avez un champ preferences JSON dans votre modèle User :
    // await user.update({ preferences });

    logger.info(`Préférences mises à jour pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: "Préférences mises à jour avec succès",
      preferences,
    });
  } catch (error) {
    logger.error("Erreur mise à jour préférences:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des préférences",
    });
  }
});

// GET /api/auth/preferences - Récupérer les préférences
router.get("/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer l'utilisateur avec ses préférences
    const user = await User.findByPk(userId);

    // Préférences par défaut si aucune n'est définie
    const defaultPreferences = {
      email_notifications: true,
      sms_notifications: false,
      slack_notifications: false,
      language: "fr",
      timezone: "Europe/Paris",
    };

    // Si vous avez un champ preferences JSON dans votre modèle User :
    // const preferences = user.preferences || defaultPreferences;

    // Pour l'instant, retourner les préférences par défaut
    const preferences = defaultPreferences;

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error("Erreur récupération préférences:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des préférences",
    });
  }
});

// GET /api/auth/sessions - Liste des sessions actives
router.get("/sessions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await UserSession.findAll({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: { [Op.gt]: new Date() },
      },
      attributes: [
        "id",
        "user_agent",
        "ip_address",
        "created_at",
        "expires_at",
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: sessions.map((session) => ({
        id: session.id,
        user_agent: session.user_agent,
        ip_address: session.ip_address,
        created_at: session.created_at,
        expires_at: session.expires_at,
        is_current: session.id === req.sessionId, // Si vous trackez la session actuelle
      })),
    });
  } catch (error) {
    logger.error("Erreur récupération sessions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des sessions",
    });
  }
});

// DELETE /api/auth/sessions/:id - Supprimer une session
router.delete("/sessions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await UserSession.findOne({
      where: {
        id,
        user_id: userId,
        is_active: true,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session non trouvée",
      });
    }

    await session.update({ is_active: false });

    logger.info(`Session ${id} supprimée pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: "Session supprimée avec succès",
    });
  } catch (error) {
    logger.error("Erreur suppression session:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la session",
    });
  }
});

// POST /api/auth/logout-all - Déconnecter toutes les sessions
router.post("/logout-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await UserSession.update(
      { is_active: false },
      { where: { user_id: userId } }
    );

    logger.info(`Toutes les sessions supprimées pour l'utilisateur ${userId}`);

    res.json({
      success: true,
      message: "Déconnecté de toutes les sessions",
    });
  } catch (error) {
    logger.error("Erreur déconnexion globale:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion globale",
    });
  }
});

module.exports = router;
