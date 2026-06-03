// Importe les comptes d'hébergement et leurs sites depuis hosting-import.json
// (généré par extract-hosting.py). Idempotent : relançable sans créer de doublons.
const fs = require("fs");
const path = require("path");
const validator = require("validator");
const sequelize = require("../config/database");
const { Website, HostingAccount, User } = require("../models");

const normalizeUrl = (raw) => {
  let u = (raw || "").trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
};
const urlKey = (u) =>
  u
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();

(async () => {
  try {
    await sequelize.authenticate();

    const jsonPath = path.join(__dirname, "hosting-import.json");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    // Utilisateur/entreprise par défaut (mono-tenant)
    const defaultUser = await User.findOne({ order: [["id", "ASC"]] });
    if (!defaultUser) {
      throw new Error(
        "Aucun utilisateur en base : créez d'abord un compte (scripts/createUser.js)"
      );
    }
    const companyId = defaultUser.company_id;
    const createdBy = defaultUser.id;

    // Index des sites existants par URL normalisée
    const existing = await Website.findAll();
    const byKey = new Map();
    for (const w of existing) byKey.set(urlKey(w.url), w);

    let accountsCreated = 0;
    let sitesCreated = 0;
    let sitesLinked = 0;
    let sitesSkipped = 0;
    let sitesInvalid = 0;

    for (const entry of data) {
      const accountName = (entry.account || "").trim();
      if (!accountName) continue;

      let [account, createdAcc] = await HostingAccount.findOrCreate({
        where: { name: accountName },
        defaults: { name: accountName },
      });
      if (createdAcc) accountsCreated++;

      for (const site of entry.sites) {
        const url = normalizeUrl(site.url);
        const key = urlKey(url);
        if (!key) continue;
        // Ignorer les URL non valides (cellules incomplètes dans l'Excel)
        if (!validator.isURL(url)) {
          console.warn(`  URL ignorée (invalide): "${site.url}" [${accountName}]`);
          sitesInvalid++;
          continue;
        }

        const isActive = /LIVE/i.test(site.etat || "");
        const existingSite = byKey.get(key);

        if (existingSite) {
          // Rattacher au compte d'hébergement si pas déjà fait
          if (!existingSite.hosting_account_id) {
            await existingSite.update({ hosting_account_id: account.id });
            sitesLinked++;
          } else {
            sitesSkipped++;
          }
          continue;
        }

        const created = await Website.create({
          name: site.name || url,
          url,
          company_id: companyId,
          created_by: createdBy,
          hosting_account_id: account.id,
          client_name: accountName,
          status: isActive ? "up" : "maintenance",
          is_active: isActive,
          check_interval: 300,
          timeout_threshold: 10000,
          ssl_check: true,
        });
        byKey.set(key, created);
        sitesCreated++;
      }
    }

    console.log("=== Import terminé ===");
    console.log("Comptes créés      :", accountsCreated);
    console.log("Sites créés        :", sitesCreated);
    console.log("Sites rattachés    :", sitesLinked);
    console.log("Sites déjà présents:", sitesSkipped);
    console.log("URLs invalides     :", sitesInvalid);
  } catch (e) {
    console.error("ERREUR import:", e.message);
  } finally {
    await sequelize.close();
  }
})();
