// Utilitaires de formatage partagés (sites, détail, clients)

export const STATUS_LABELS = {
  up: "En ligne",
  down: "Hors ligne",
  warning: "Dégradé",
  maintenance: "Maintenance",
};

export const statusBadgeClass = (status) => {
  switch (status) {
    case "up":
      return "bg-green-100 text-green-800";
    case "down":
      return "bg-red-100 text-red-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800";
    case "maintenance":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const statusDotClass = (status) => {
  switch (status) {
    case "up":
      return "bg-green-500";
    case "down":
      return "bg-red-500";
    case "warning":
      return "bg-yellow-500";
    case "maintenance":
      return "bg-blue-500";
    default:
      return "bg-gray-400";
  }
};

export const formatResponseTime = (ms) => {
  if (ms === null || ms === undefined) return "—";
  return `${ms} ms`;
};

export const responseTimeColor = (ms) => {
  if (ms === null || ms === undefined) return "text-gray-400";
  if (ms < 500) return "text-green-600";
  if (ms < 1500) return "text-yellow-600";
  return "text-red-600";
};

export const formatUptime = (value) => {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
};

export const uptimeColor = (value) => {
  if (value === null || value === undefined) return "text-gray-400";
  if (value >= 99) return "text-green-600";
  if (value >= 95) return "text-yellow-600";
  return "text-red-600";
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Temps relatif court : "il y a 3 min", "il y a 2 h"
export const formatRelative = (date) => {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
};

// Nombre de jours avant expiration (peut être négatif si expiré)
export const daysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

// Infos d'affichage pour une date d'expiration (SSL ou hébergement)
export const expiryInfo = (date) => {
  const days = daysUntil(date);
  if (days === null) return { label: "—", color: "text-gray-400" };
  if (days < 0) return { label: "Expiré", color: "text-red-600 font-medium" };
  if (days <= 15)
    return { label: `${days} j`, color: "text-red-600 font-medium" };
  if (days <= 30) return { label: `${days} j`, color: "text-yellow-600" };
  return { label: formatDate(date), color: "text-gray-600" };
};

// Durée lisible à partir d'un nombre de secondes
export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  if (hours < 24) return remMin ? `${hours}h ${remMin}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}j ${remHours}h` : `${days}j`;
};

// Durée écoulée depuis une date (pour intervention en cours)
export const elapsedSince = (date) => {
  if (!date) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 1000));
};

export const INTERVENTION_TYPES = [
  { value: "maintenance", label: "Maintenance" },
  { value: "corrective", label: "Correctif" },
  { value: "update", label: "Mise à jour" },
  { value: "incident", label: "Incident" },
  { value: "other", label: "Autre" },
];

export const INTERVENTION_TYPE_LABELS = INTERVENTION_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

export const RESOLUTIONS = [
  { value: "resolved", label: "Résolu" },
  { value: "pending", label: "En attente" },
  { value: "follow_up", label: "À suivre" },
  { value: "failed", label: "Échec" },
];

export const RESOLUTION_LABELS = RESOLUTIONS.reduce((acc, r) => {
  acc[r.value] = r.label;
  return acc;
}, {});

export const resolutionBadgeClass = (resolution) => {
  switch (resolution) {
    case "resolved":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "follow_up":
      return "bg-blue-100 text-blue-700";
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

// Pour pré-remplir un <input type="date"> à partir d'une date ISO
export const toDateInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};
