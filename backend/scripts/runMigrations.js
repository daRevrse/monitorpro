// Exécute toutes les migrations .sql du dossier migrations/ dans l'ordre.
// Tolérant aux relances (ignore les "colonne/table déjà existante").
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const sequelize = require("../config/database");

(async () => {
  try {
    await sequelize.authenticate();
    const dir = path.join(__dirname, "../migrations");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      let sql = fs.readFileSync(path.join(dir, file), "utf8");
      sql = sql
        .split(/\r?\n/)
        .filter((l) => !l.trim().startsWith("--"))
        .join("\n");
      const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);

      let skipped = 0;
      for (const st of statements) {
        try {
          await sequelize.query(st);
        } catch (e) {
          if (/duplicate|already exists|exists/i.test(e.message)) {
            skipped++;
          } else {
            console.error(`  ⚠ ${file}: ${e.message}`);
          }
        }
      }
      console.log(`✓ ${file}${skipped ? ` (${skipped} déjà appliqué(s))` : ""}`);
    }

    console.log("Migrations terminées.");
  } catch (e) {
    console.error("Erreur migrations:", e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
