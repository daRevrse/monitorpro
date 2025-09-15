module.exports = {
  // Configuration Trust Proxy selon l'environnement
  getTrustProxyConfig: () => {
    const env = process.env.NODE_ENV;

    switch (env) {
      case "production":
        // En production, faire confiance au premier proxy (nginx, cloudflare, etc.)
        return 1;

      case "staging":
        // En staging, configuration similaire à la production
        return 1;

      case "development":
      default:
        // En développement, faire confiance aux proxies locaux
        return "loopback";
    }
  },

  // Configuration CORS selon l'environnement
  getCorsConfig: () => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    // Ajouter les domaines de production si définis
    if (process.env.PRODUCTION_DOMAIN) {
      allowedOrigins.push(`https://${process.env.PRODUCTION_DOMAIN}`);
      allowedOrigins.push(`http://${process.env.PRODUCTION_DOMAIN}`);
    }

    return {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 200, // Pour supporter les anciens navigateurs
    };
  },

  // Configuration Helmet selon l'environnement
  getHelmetConfig: () => {
    return {
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
      hsts:
        process.env.NODE_ENV === "production"
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
    };
  },
};
