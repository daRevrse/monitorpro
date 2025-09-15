// backend/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Importation des modules
const logger = require("./utils/logger");
const sequelize = require("./config/database");

// Routes
const authRoutes = require("./routes/auth");
const websiteRoutes = require("./routes/websites");
const monitoringRoutes = require("./routes/monitoring");
const incidentRoutes = require("./routes/incidents");

// Services et Jobs
const monitorCron = require("./jobs/monitorCron");

// Middleware personnalisés
const { authenticateToken } = require("./middleware/auth");

class MonitorProApp {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      },
    });
    this.port = process.env.PORT || 3001;

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeDatabase();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  // Configuration des middlewares
  initializeMiddleware() {
    logger.info("Configuration des middlewares...");

    // ✅ Configuration Trust Proxy - IMPORTANT pour éviter l'erreur rate limit
    if (process.env.NODE_ENV === "production") {
      this.app.set("trust proxy", 1); // Faire confiance au premier proxy
    } else {
      this.app.set("trust proxy", "loopback"); // Développement local
    }

    // Sécurité
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
          },
        },
      })
    );

    // CORS
    this.app.use(
      cors({
        origin: [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Rate limiting général
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limite de 100 requêtes par IP
      message: {
        success: false,
        message: "Trop de requêtes, veuillez réessayer plus tard.",
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Utiliser l'IP réelle en tenant compte des proxies
        return req.ip || req.connection.remoteAddress || "unknown";
      },
      skip: (req) => {
        // Ignorer le rate limiting pour les routes de monitoring internes
        return (
          req.path.startsWith("/api/monitoring/internal") ||
          req.path === "/health"
        );
      },
      onExceeded: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      },
    });

    // Rate limiting plus strict pour l'authentification
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10, // 10 tentatives de connexion par IP
      message: {
        success: false,
        message:
          "Trop de tentatives de connexion, veuillez réessayer plus tard.",
      },
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || "unknown";
      },
      onExceeded: (req, res) => {
        logger.warn(
          `Auth rate limit exceeded for IP: ${req.ip}, Email: ${
            req.body.email || "unknown"
          }`
        );
      },
    });

    this.app.use("/api/auth/login", authLimiter);
    this.app.use("/api/", limiter);

    // Parsing du body
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging des requêtes en développement
    if (process.env.NODE_ENV === "development") {
      this.app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path} - IP: ${req.ip}`);
        next();
      });
    }

    // Headers personnalisés
    this.app.use((req, res, next) => {
      res.setHeader("X-Powered-By", "MonitorPro");
      res.setHeader("X-API-Version", "1.0");
      next();
    });
  }

  // Configuration des routes
  initializeRoutes() {
    logger.info("Configuration des routes...");

    // Route de santé
    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        message: "MonitorPro API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        uptime: process.uptime(),
      });
    });

    // Routes API
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/websites", websiteRoutes);
    this.app.use("/api/monitoring", monitoringRoutes);
    this.app.use("/api/incidents", incidentRoutes);

    // Route pour les statistiques système (admin seulement)
    this.app.get("/api/system/stats", authenticateToken, (req, res) => {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Accès interdit",
        });
      }

      const stats = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        env: process.env.NODE_ENV,
        version: process.version,
        platform: process.platform,
      };

      res.json({
        success: true,
        data: stats,
      });
    });

    // Route 404 pour API
    this.app.use("/api/*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Endpoint API non trouvé",
        path: req.path,
      });
    });

    // Servir les fichiers statiques du frontend en production
    if (process.env.NODE_ENV === "production") {
      const path = require("path");
      this.app.use(express.static(path.join(__dirname, "../frontend/build")));

      this.app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
      });
    }
  }

  // Initialisation de la base de données
  async initializeDatabase() {
    try {
      logger.info("Connexion à la base de données...");

      await sequelize.authenticate();
      logger.success("Connexion à la base de données établie");

      // Synchroniser les modèles en développement
      if (process.env.NODE_ENV === "development") {
        await sequelize.sync({ alter: false }); // Changed to false to avoid altering existing tables
        logger.info("Modèles synchronisés avec la base de données");
      }
    } catch (error) {
      logger.error("Impossible de se connecter à la base de données:", error);
      process.exit(1);
    }
  }

  // Configuration WebSocket
  initializeWebSocket() {
    logger.info("Configuration WebSocket...");

    // Middleware d'authentification pour Socket.IO
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Token d'authentification requis"));
      }

      const jwt = require("jsonwebtoken");
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userCompany = decoded.company_id;
        next();
      } catch (err) {
        next(new Error("Token invalide"));
      }
    });

    // Gestion des connexions WebSocket
    this.io.on("connection", (socket) => {
      logger.info(`Client connecté: ${socket.id} (User: ${socket.userId})`);

      // Rejoindre la room de l'entreprise
      if (socket.userCompany) {
        socket.join(`company_${socket.userCompany}`);
      }

      // Rejoindre la room globale pour les admins
      socket.join("global");

      // Événements personnalisés
      socket.on("subscribe_monitoring", (data) => {
        logger.debug(`Souscription monitoring: ${socket.userId}`);
        socket.join("monitoring_updates");
      });

      socket.on("unsubscribe_monitoring", () => {
        logger.debug(`Désinscription monitoring: ${socket.userId}`);
        socket.leave("monitoring_updates");
      });

      socket.on("disconnect", (reason) => {
        logger.info(`Client déconnecté: ${socket.id} (Raison: ${reason})`);
      });
    });

    // Méthodes utilitaires pour émettre des événements
    this.broadcastToCompany = (companyId, event, data) => {
      this.io.to(`company_${companyId}`).emit(event, data);
    };

    this.broadcastGlobal = (event, data) => {
      this.io.to("global").emit(event, data);
    };

    this.broadcastMonitoring = (event, data) => {
      this.io.to("monitoring_updates").emit(event, data);
    };

    // Rendre les méthodes de broadcast disponibles globalement
    global.socketBroadcast = {
      toCompany: this.broadcastToCompany,
      global: this.broadcastGlobal,
      monitoring: this.broadcastMonitoring,
    };
  }

  // Gestion des erreurs
  initializeErrorHandling() {
    // Middleware de gestion des erreurs 404
    this.app.use((req, res, next) => {
      const error = new Error(`Route non trouvée - ${req.originalUrl}`);
      error.status = 404;
      next(error);
    });

    // Middleware de gestion des erreurs globales
    this.app.use((error, req, res, next) => {
      const status = error.status || 500;
      const message = error.message || "Erreur serveur interne";

      logger.error("Erreur serveur:", {
        error: message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.status(status).json({
        success: false,
        message:
          process.env.NODE_ENV === "development" ? message : "Erreur serveur",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      });
    });

    // Gestion des erreurs non capturées
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Promesse rejetée non gérée:", reason);
    });

    process.on("uncaughtException", (error) => {
      logger.error("Exception non gérée:", error);
      process.exit(1);
    });

    // Gestion propre de l'arrêt
    process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));
  }

  // Arrêt propre de l'application
  async gracefulShutdown(signal) {
    logger.info(`Signal ${signal} reçu, arrêt en cours...`);

    // Arrêter les jobs cron
    try {
      monitorCron.stopAllJobs();
    } catch (error) {
      logger.error("Erreur lors de l'arrêt des jobs cron:", error);
    }

    // Fermer les connexions WebSocket
    this.io.close(() => {
      logger.info("Connexions WebSocket fermées");
    });

    // Fermer le serveur HTTP
    this.server.close(async () => {
      logger.info("Serveur HTTP fermé");

      // Fermer la connexion à la base de données
      try {
        await sequelize.close();
        logger.info("Connexion à la base de données fermée");
      } catch (error) {
        logger.error(
          "Erreur lors de la fermeture de la base de données:",
          error
        );
      }

      logger.info("Arrêt terminé");
      process.exit(0);
    });

    // Force l'arrêt après 30 secondes
    setTimeout(() => {
      logger.error("Arrêt forcé après timeout");
      process.exit(1);
    }, 30000);
  }

  // Démarrer le serveur
  async start() {
    try {
      // Démarrer les tâches cron
      monitorCron.startAllJobs();

      // Démarrer le serveur
      this.server.listen(this.port, () => {
        logger.success(`MonitorPro API démarrée sur le port ${this.port}`);
        logger.info(`Environnement: ${process.env.NODE_ENV}`);
        logger.info(`URL de santé: http://localhost:${this.port}/health`);

        if (process.env.NODE_ENV === "development") {
          logger.info(
            `Frontend URL: ${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }`
          );
        }
      });
    } catch (error) {
      logger.error("Erreur lors du démarrage du serveur:", error);
      process.exit(1);
    }
  }
}

module.exports = MonitorProApp;
