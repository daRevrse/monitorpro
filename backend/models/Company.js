// models/Company.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Company = sequelize.define(
  "Company",
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
    slug: {
      type: DataTypes.STRING(100),
      unique: true,
    },
    subscription_plan: {
      type: DataTypes.ENUM("basic", "pro", "enterprise"),
      defaultValue: "basic",
    },
    max_sites: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
    },
  },
  {
    tableName: "companies",
  }
);

module.exports = Company;
