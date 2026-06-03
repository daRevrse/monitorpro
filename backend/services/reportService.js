// backend/services/reportService.js
// Construit un rapport agrégé par site sur une période donnée.
const { Op } = require("sequelize");
const {
  Website,
  WebsiteCheck,
  Incident,
  Intervention,
  HostingAccount,
} = require("../models");

const PERIODS = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const PERIOD_LABELS = {
  "1h": "Dernière heure",
  "24h": "Dernières 24h",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
};

async function getReport({ period = "24h", siteId = null } = {}) {
  const ms = PERIODS[period] || PERIODS["24h"];
  const since = new Date(Date.now() - ms);

  const websiteWhere = {};
  if (siteId) websiteWhere.id = siteId;

  const websites = await Website.findAll({
    where: websiteWhere,
    include: [{ model: HostingAccount, as: "hostingAccount" }],
    order: [["name", "ASC"]],
  });
  const siteIds = websites.map((w) => w.id);

  const inPeriod = { [Op.gte]: since };
  const [checks, incidents, interventions] = await Promise.all([
    siteIds.length
      ? WebsiteCheck.findAll({
          where: { website_id: { [Op.in]: siteIds }, checked_at: inPeriod },
        })
      : [],
    siteIds.length
      ? Incident.findAll({
          where: { website_id: { [Op.in]: siteIds }, started_at: inPeriod },
        })
      : [],
    siteIds.length
      ? Intervention.findAll({
          where: { website_id: { [Op.in]: siteIds }, started_at: inPeriod },
        })
      : [],
  ]);

  // Indexation par site
  const idx = {};
  for (const w of websites) {
    idx[w.id] = {
      site_id: w.id,
      name: w.name,
      url: w.url,
      client_name: w.client_name || "",
      hosting_account: w.hostingAccount ? w.hostingAccount.name : "",
      checks: [],
      incidents: 0,
      interventions: 0,
      interventions_duration_seconds: 0,
    };
  }
  for (const c of checks) idx[c.website_id] && idx[c.website_id].checks.push(c);
  for (const i of incidents) idx[i.website_id] && idx[i.website_id].incidents++;
  for (const v of interventions) {
    const row = idx[v.website_id];
    if (!row) continue;
    row.interventions++;
    if (v.started_at && v.ended_at) {
      row.interventions_duration_seconds += Math.round(
        (new Date(v.ended_at) - new Date(v.started_at)) / 1000
      );
    }
  }

  const rows = Object.values(idx).map((r) => {
    const total = r.checks.length;
    const up = r.checks.filter((c) => c.status === "up").length;
    const down = r.checks.filter((c) => c.status === "down").length;
    const warning = r.checks.filter((c) => c.status === "warning").length;
    const rts = r.checks
      .filter((c) => c.status === "up" && c.response_time)
      .map((c) => c.response_time);
    const avg = rts.length
      ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
      : null;
    const min = rts.length ? Math.min(...rts) : null;
    const max = rts.length ? Math.max(...rts) : null;

    return {
      site_id: r.site_id,
      name: r.name,
      url: r.url,
      client_name: r.client_name,
      hosting_account: r.hosting_account,
      total_checks: total,
      up,
      down,
      warning,
      uptime: total ? parseFloat(((up / total) * 100).toFixed(2)) : null,
      avg_response: avg,
      min_response: min,
      max_response: max,
      incidents: r.incidents,
      interventions: r.interventions,
      interventions_duration_seconds: r.interventions_duration_seconds,
    };
  });

  // Totaux
  const totalChecks = rows.reduce((a, r) => a + r.total_checks, 0);
  const totalUp = rows.reduce((a, r) => a + r.up, 0);
  const totals = {
    sites: rows.length,
    total_checks: totalChecks,
    uptime: totalChecks ? parseFloat(((totalUp / totalChecks) * 100).toFixed(2)) : null,
    incidents: rows.reduce((a, r) => a + r.incidents, 0),
    interventions: rows.reduce((a, r) => a + r.interventions, 0),
  };

  return {
    period,
    period_label: PERIOD_LABELS[period] || period,
    since,
    generated_at: new Date(),
    rows,
    totals,
  };
}

// Colonnes partagées pour les exports
const COLUMNS = [
  { key: "name", header: "Site" },
  { key: "url", header: "URL" },
  { key: "client_name", header: "Client" },
  { key: "hosting_account", header: "Hébergement" },
  { key: "uptime", header: "Uptime (%)" },
  { key: "total_checks", header: "Checks" },
  { key: "up", header: "Up" },
  { key: "down", header: "Down" },
  { key: "warning", header: "Warning" },
  { key: "avg_response", header: "Tps moy (ms)" },
  { key: "min_response", header: "Tps min (ms)" },
  { key: "max_response", header: "Tps max (ms)" },
  { key: "incidents", header: "Incidents" },
  { key: "interventions", header: "Interventions" },
];

module.exports = { getReport, COLUMNS, PERIOD_LABELS };
