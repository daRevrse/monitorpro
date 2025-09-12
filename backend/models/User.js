// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "manager", "technician", "client"),
      defaultValue: "technician",
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "companies",
        key: "id",
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    indexes: [{ fields: ["email"] }, { fields: ["company_id", "role"] }],
  }
);

// Méthodes d'instance
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

User.prototype.getFullName = function () {
  return `${this.first_name} ${this.last_name}`;
};

// Méthodes de classe
User.hashPassword = async function (password) {
  return bcrypt.hash(password, 12);
};

module.exports = User;
