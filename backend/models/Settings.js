// ========================================
// backend/models/Settings.js  (ligne unique, id = 1)
// ========================================
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Settings = sequelize.define(
  "Settings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    // SMTP / email
    smtp_host: { type: DataTypes.STRING(255), allowNull: true },
    smtp_port: { type: DataTypes.INTEGER, allowNull: true },
    smtp_secure: { type: DataTypes.BOOLEAN, defaultValue: false },
    smtp_user: { type: DataTypes.STRING(255), allowNull: true },
    smtp_pass: { type: DataTypes.STRING(255), allowNull: true },
    smtp_from: { type: DataTypes.STRING(255), allowNull: true },
    // Alertes
    slack_webhook_url: { type: DataTypes.STRING(500), allowNull: true },
    alert_cooldown: { type: DataTypes.INTEGER, defaultValue: 600000 },
    // Monitoring par défaut
    default_check_interval: { type: DataTypes.INTEGER, defaultValue: 300 },
    default_timeout: { type: DataTypes.INTEGER, defaultValue: 10000 },
    default_ssl_check: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "app_settings",
  }
);

module.exports = Settings;
