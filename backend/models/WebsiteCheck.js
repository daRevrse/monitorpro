// ========================================
// backend/models/WebsiteCheck.js
// ========================================
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WebsiteCheck = sequelize.define(
  "WebsiteCheck",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    website_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "websites",
        key: "id",
      },
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    response_time: {
      type: DataTypes.INTEGER, // en millisecondes
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("up", "down", "warning"),
      allowNull: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ssl_valid: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    ssl_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "website_checks",
    indexes: [
      { fields: ["website_id", "checked_at"] },
      { fields: ["status", "checked_at"] },
    ],
  }
);

module.exports = WebsiteCheck;
