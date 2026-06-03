// ========================================
// backend/models/HostingAccount.js
// ========================================
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HostingAccount = sequelize.define(
  "HostingAccount",
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
    provider: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    login: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    panel_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    account_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "hosting_accounts",
    indexes: [{ fields: ["name"] }],
  }
);

module.exports = HostingAccount;
