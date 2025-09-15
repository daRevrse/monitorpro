const fs = require("fs");
const path = require("path");

const replacements = [
  { from: /bg-blue-500/g, to: "bg-bordeaux-600" },
  { from: /bg-blue-600/g, to: "bg-bordeaux-700" },
  { from: /bg-blue-50/g, to: "bg-bordeaux-50" },
  { from: /text-blue-600/g, to: "text-bordeaux-600" },
  { from: /text-blue-500/g, to: "text-bordeaux-500" },
  { from: /border-blue-200/g, to: "border-bordeaux-200" },
  { from: /border-blue-500/g, to: "border-bordeaux-500" },
  { from: /ring-blue-500/g, to: "ring-bordeaux-500" },
  { from: /hover:bg-blue-600/g, to: "hover:bg-bordeaux-700" },
  { from: /hover:text-blue-800/g, to: "hover:text-bordeaux-800" },
  { from: /focus:ring-blue-500/g, to: "focus:ring-bordeaux-500" },
  { from: /focus:border-blue-500/g, to: "focus:border-bordeaux-500" },
];

function updateColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Mis à jour: ${filePath}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !["node_modules", ".git"].includes(file)) {
      walkDirectory(filePath);
    } else if (file.endsWith(".js") || file.endsWith(".jsx")) {
      updateColorsInFile(filePath);
    }
  });
}

// Exécuter le script
console.log("🎨 Mise à jour des couleurs vers le thème bordeaux...");
walkDirectory("./src");
console.log("✅ Terminé!");
