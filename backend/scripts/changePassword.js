const bcrypt = require("bcrypt");
const { User } = require("../models");
const sequelize = require("../config/database");

async function changePassword() {
  try {
    await sequelize.authenticate();

    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log("❌ Usage: node changePassword.js <email> <newPassword>");
      console.log(
        "📝 Exemple: node changePassword.js admin@monitorpro.com nouveaumotdepasse123"
      );
      process.exit(1);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: passwordHash });

    console.log("✅ Mot de passe mis à jour avec succès !");
    console.log(`👤 Utilisateur: ${user.first_name} ${user.last_name}`);
    console.log(`📧 Email: ${email}`);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

changePassword();
