// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const User = require("../models/User");
const Company = require("../models/Company");
const UserSession = require("../models/UserSession");

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

module.exports = router;
