const { User, Company } = require("../models");
const sequelize = require("../config/database");

async function listUsers() {
  try {
    await sequelize.authenticate();

    const users = await User.findAll({
      include: [
        {
          model: Company,
          as: "company",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    console.log("👥 Liste des utilisateurs:");
    console.log("========================");

    if (users.length === 0) {
      console.log("Aucun utilisateur trouvé");
      return;
    }

    users.forEach((user) => {
      console.log(`🆔 ID: ${user.id}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Nom: ${user.first_name} ${user.last_name}`);
      console.log(`🔑 Rôle: ${user.role}`);
      console.log(
        `🏢 Entreprise: ${user.company ? user.company.name : "Aucune"}`
      );
      console.log(`✅ Actif: ${user.is_active ? "Oui" : "Non"}`);
      console.log(`📅 Créé: ${user.created_at.toLocaleString("fr-FR")}`);
      console.log("------------------------");
    });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

listUsers();
