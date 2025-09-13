const bcrypt = require("bcrypt");
const { User, Company } = require("../models");
const sequelize = require("../config/database");

async function createUser() {
  try {
    // Se connecter à la base de données
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données établie");

    // Données de l'utilisateur
    const email = process.argv[2];
    const password = process.argv[3];
    const firstName = process.argv[4];
    const lastName = process.argv[5];
    const role = process.argv[6] || "technician";
    const companyName = process.argv[7] || "Administration";

    if (!email || !password || !firstName || !lastName) {
      console.log(
        "❌ Usage: node createUser.js <email> <password> <firstName> <lastName> [role] [companyName]"
      );
      console.log(
        '📝 Exemple: node createUser.js john@example.com motdepasse123 John Doe admin "Mon Entreprise"'
      );
      console.log("🔑 Rôles disponibles: admin, manager, technician, client");
      process.exit(1);
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log("❌ Un utilisateur avec cet email existe déjà");
      process.exit(1);
    }

    // Trouver ou créer l'entreprise
    let company = await Company.findOne({ where: { name: companyName } });
    if (!company) {
      company = await Company.create({
        name: companyName,
        slug: companyName.toLowerCase().replace(/\s+/g, "-"),
        subscription_plan: "pro",
        max_sites: 100,
      });
      console.log(`✅ Entreprise "${companyName}" créée`);
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      company_id: company.id,
      is_active: true,
      email_verified: true,
    });

    console.log("✅ Utilisateur créé avec succès !");
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Nom: ${firstName} ${lastName}`);
    console.log(`🏢 Entreprise: ${companyName}`);
    console.log(`🔑 Rôle: ${role}`);
    console.log(`🆔 ID: ${user.id}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création de l'utilisateur:",
      error.message
    );
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createUser();
