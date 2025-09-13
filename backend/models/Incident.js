// ========================================
// backend/models/Incident.js
// ========================================
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Incident = sequelize.define(
  "Incident",
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
    status: {
      type: DataTypes.ENUM("open", "acknowledged", "resolved"),
      defaultValue: "open",
    },
    severity: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      defaultValue: "medium",
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    acknowledged_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    resolved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "incidents",
    indexes: [
      { fields: ["website_id", "status"] },
      { fields: ["severity", "started_at"] },
    ],
  }
);

module.exports = Incident;
