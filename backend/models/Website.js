// models/Website.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Website = sequelize.define(
  "Website",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    },
    client_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hosting_account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "hosting_accounts",
        key: "id",
      },
    },
    site_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    hosting_provider: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hosting_account: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hosting_panel_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    hosting_account_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hosting_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    server_ip: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    check_interval: {
      type: DataTypes.INTEGER,
      defaultValue: 300, // 5 minutes
    },
    timeout_threshold: {
      type: DataTypes.INTEGER,
      defaultValue: 10000, // 10 secondes
    },
    status: {
      type: DataTypes.ENUM("up", "down", "warning", "maintenance"),
      defaultValue: "up",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    ssl_check: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "websites",
    indexes: [
      { fields: ["company_id", "status"] },
      { fields: ["is_active", "status"] },
    ],
  }
);

module.exports = Website;
