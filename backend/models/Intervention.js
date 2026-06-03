// ========================================
// backend/models/Intervention.js
// ========================================
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Intervention = sequelize.define(
  "Intervention",
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
    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    intervention_type: {
      type: DataTypes.ENUM(
        "maintenance",
        "corrective",
        "update",
        "incident",
        "other"
      ),
      defaultValue: "maintenance",
    },
    resolution: {
      type: DataTypes.ENUM("resolved", "pending", "follow_up", "failed"),
      allowNull: true,
    },
    state: {
      type: DataTypes.ENUM("in_progress", "ended"),
      defaultValue: "in_progress",
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "interventions",
    indexes: [
      { fields: ["website_id", "state"] },
      { fields: ["started_at"] },
    ],
  }
);

module.exports = Intervention;
