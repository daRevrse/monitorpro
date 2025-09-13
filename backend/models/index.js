const User = require("./User");
const Company = require("./Company");
const UserSession = require("./UserSession");
const Website = require("./Website");
const WebsiteCheck = require("./WebsiteCheck");
const Incident = require("./Incident");

// Définir les associations
Company.hasMany(User, { foreignKey: "company_id", as: "users" });
User.belongsTo(Company, { foreignKey: "company_id", as: "company" });

User.hasMany(UserSession, { foreignKey: "user_id", as: "sessions" });
UserSession.belongsTo(User, { foreignKey: "user_id", as: "user" });

Company.hasMany(Website, { foreignKey: "company_id", as: "websites" });
Website.belongsTo(Company, { foreignKey: "company_id", as: "company" });

User.hasMany(Website, { foreignKey: "created_by", as: "created_websites" });
Website.belongsTo(User, { foreignKey: "created_by", as: "creator" });

Website.hasMany(WebsiteCheck, { foreignKey: "website_id", as: "checks" });
WebsiteCheck.belongsTo(Website, { foreignKey: "website_id", as: "website" });

Website.hasMany(Incident, { foreignKey: "website_id", as: "incidents" });
Incident.belongsTo(Website, { foreignKey: "website_id", as: "website" });

User.hasMany(Incident, {
  foreignKey: "acknowledged_by",
  as: "acknowledged_incidents",
});
User.hasMany(Incident, { foreignKey: "resolved_by", as: "resolved_incidents" });
Incident.belongsTo(User, { foreignKey: "acknowledged_by", as: "acknowledger" });
Incident.belongsTo(User, { foreignKey: "resolved_by", as: "resolver" });

module.exports = {
  User,
  Company,
  UserSession,
  Website,
  WebsiteCheck,
  Incident,
};
