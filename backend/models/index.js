// models/index.js
const User = require("./User");
const Company = require("./Company");
const UserSession = require("./UserSession");
const Website = require("./Website");

// Définir les associations
Company.hasMany(User, { foreignKey: "company_id", as: "users" });
User.belongsTo(Company, { foreignKey: "company_id", as: "company" });

User.hasMany(UserSession, { foreignKey: "user_id", as: "sessions" });
UserSession.belongsTo(User, { foreignKey: "user_id", as: "user" });

Company.hasMany(Website, { foreignKey: "company_id", as: "websites" });
Website.belongsTo(Company, { foreignKey: "company_id", as: "company" });

User.hasMany(Website, { foreignKey: "created_by", as: "created_websites" });
Website.belongsTo(User, { foreignKey: "created_by", as: "creator" });

module.exports = {
  User,
  Company,
  UserSession,
  Website,
};
