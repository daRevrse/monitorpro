import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Activity,
  Clock,
  Shield,
  CheckCircle,
  Server,
  Globe,
  AlertTriangle,
  Wrench,
  Play,
  Square,
  ImageOff,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../services/api";
import {
  STATUS_LABELS,
  statusBadgeClass,
  statusDotClass,
  formatResponseTime,
  responseTimeColor,
  formatDateTime,
  formatDate,
  expiryInfo,
  formatDuration,
  elapsedSince,
  INTERVENTION_TYPES,
  INTERVENTION_TYPE_LABELS,
  RESOLUTIONS,
  RESOLUTION_LABELS,
  resolutionBadgeClass,
} from "../utils/format";

const PERIODS = [
  { key: "1h", label: "1h" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7j" },
  { key: "30d", label: "30j" },
];

const StatCard = ({ icon: Icon, label, value, valueClass = "" }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
      <Icon className="w-4 h-4" />
      {label}
    </div>
    <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
  </div>
);

const SiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [period, setPeriod] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [exporting, setExporting] = useState(null);

  // Aperçu
  const [previewError, setPreviewError] = useState(false);

  // Interventions
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startForm, setStartForm] = useState({
    title: "",
    intervention_type: "maintenance",
    description: "",
  });
  const [endForm, setEndForm] = useState({
    resolution: "resolved",
    description: "",
  });
  // Tick pour le chronomètre de l'intervention en cours
  const [, setTick] = useState(0);
  const tickRef = useRef(null);

  const loadDetail = useCallback(async () => {
    try {
      const response = await api.get(`/monitoring/sites/${id}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Erreur chargement détail site:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTimeline = useCallback(async () => {
    try {
      const response = await api.get("/monitoring/stats", {
        params: { site_id: id, period },
      });
      if (response.data.success) {
        setTimeline(response.data.data.timeline || []);
      }
    } catch (error) {
      console.error("Erreur chargement timeline:", error);
    }
  }, [id, period]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const handleForceCheck = async () => {
    setChecking(true);
    try {
      await api.post(`/monitoring/sites/${id}/check`);
      // Le check est planifié ~1s plus tard côté serveur, on recharge après un délai
      setTimeout(() => {
        loadDetail();
        loadTimeline();
        setChecking(false);
      }, 3000);
    } catch (error) {
      console.error("Erreur vérification forcée:", error);
      setChecking(false);
    }
  };

  const downloadExport = async (format) => {
    setExporting(format);
    try {
      const params = new URLSearchParams({
        period: "30d",
        format,
        site_id: id,
      });
      const res = await api.get(`/reports/export?${params}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-site-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erreur lors de l'export");
    } finally {
      setExporting(null);
    }
  };

  const activeIntervention = data?.active_intervention || null;

  // Chronomètre live tant qu'une intervention est en cours
  useEffect(() => {
    if (activeIntervention) {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(tickRef.current);
    }
  }, [activeIntervention]);

  const handleStartIntervention = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/interventions", {
        website_id: parseInt(id),
        title: startForm.title,
        intervention_type: startForm.intervention_type,
        description: startForm.description || null,
      });
      setShowStartModal(false);
      setStartForm({
        title: "",
        intervention_type: "maintenance",
        description: "",
      });
      loadDetail();
    } catch (error) {
      console.error("Erreur démarrage intervention:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors du démarrage de l'intervention"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndIntervention = async (e) => {
    e.preventDefault();
    if (!activeIntervention) return;
    setSubmitting(true);
    try {
      await api.put(`/interventions/${activeIntervention.id}/end`, {
        resolution: endForm.resolution,
        ...(endForm.description ? { description: endForm.description } : {}),
      });
      setShowEndModal(false);
      setEndForm({ resolution: "resolved", description: "" });
      loadDetail();
    } catch (error) {
      console.error("Erreur fin intervention:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de la clôture de l'intervention"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-bordeaux-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/app/sites")}
          className="flex items-center gap-2 text-bordeaux-600 hover:text-bordeaux-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux sites
        </button>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          Site introuvable.
        </div>
      </div>
    );
  }

  const { site, stats, recent_checks, incidents, interventions } = data;
  const ssl = expiryInfo(stats.ssl_expires_at);
  const previewUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(
    site.url
  )}?w=600&h=450`;
  const chartData = timeline.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    response: t.avg_response_time,
    uptime: Math.round(t.uptime_percentage),
  }));

  return (
    <div className="p-6">
      {/* En-tête */}
      <button
        onClick={() => navigate("/app/sites")}
        className="flex items-center gap-2 text-bordeaux-600 hover:text-bordeaux-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux sites
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClass(
                site.status
              )}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusDotClass(
                  site.status
                )}`}
              />
              {STATUS_LABELS[site.status] || site.status}
            </span>
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-bordeaux-600 hover:underline mt-1"
          >
            {site.url}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            {site.client_name && <span>{site.client_name}</span>}
            {site.site_type && (
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                {site.site_type}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Exports du rapport de ce site (période 30j) */}
          {[
            { format: "csv", label: "CSV" },
            { format: "xlsx", label: "Excel" },
            { format: "pdf", label: "PDF" },
          ].map((b) => (
            <button
              key={b.format}
              onClick={() => downloadExport(b.format)}
              disabled={exporting === b.format}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-bordeaux-50 hover:border-bordeaux-300 text-sm transition-colors disabled:opacity-60"
              title={`Exporter le rapport (${b.label})`}
            >
              <Download className="w-4 h-4 text-bordeaux-600" />
              {exporting === b.format ? "…" : b.label}
            </button>
          ))}
          <button
            onClick={handleForceCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Vérification…" : "Vérifier maintenant"}
          </button>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Activity}
          label="Uptime 24h"
          value={`${stats.uptime}%`}
          valueClass={
            stats.uptime >= 99
              ? "text-green-600"
              : stats.uptime >= 95
              ? "text-yellow-600"
              : "text-red-600"
          }
        />
        <StatCard
          icon={Clock}
          label="Temps réponse moyen"
          value={formatResponseTime(stats.avg_response_time)}
          valueClass={responseTimeColor(stats.avg_response_time)}
        />
        <StatCard
          icon={CheckCircle}
          label="Checks 24h"
          value={`${stats.up_checks_24h}/${stats.total_checks_24h}`}
        />
        <StatCard
          icon={Shield}
          label="Certificat SSL"
          value={site.ssl_check ? ssl.label : "Désactivé"}
          valueClass={site.ssl_check ? ssl.color : "text-gray-400"}
        />
      </div>

      {/* Graphique temps de réponse */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Temps de réponse</h2>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  period === p.key
                    ? "bg-bordeaux-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            Aucune donnée sur cette période.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                unit=" ms"
                width={60}
              />
              <Tooltip
                formatter={(value) => [`${value} ms`, "Temps de réponse"]}
              />
              <Line
                type="monotone"
                dataKey="response"
                stroke="#9f1239"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos techniques / hébergement */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-400" />
            Informations techniques
          </h2>
          <dl className="space-y-3 text-sm">
            <InfoRow icon={Globe} label="Type de site" value={site.site_type} />
            {/* Compte d'hébergement lié */}
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-gray-500">
                <Server className="w-4 h-4 text-gray-400" />
                Compte d'hébergement
              </dt>
              <dd className="text-right">
                {site.hosting_account ? (
                  <button
                    onClick={() => navigate("/app/hostings")}
                    className="text-bordeaux-600 hover:underline font-medium"
                  >
                    {site.hosting_account.name}
                  </button>
                ) : (
                  <span className="text-gray-800">—</span>
                )}
              </dd>
            </div>
            <InfoRow
              icon={Server}
              label="Hébergeur"
              value={
                site.hosting_account?.provider || site.hosting_provider || null
              }
            />
            <InfoRow
              icon={Server}
              label="Login compte"
              value={site.hosting_account?.login}
            />
            <InfoRow
              icon={Server}
              label="Email du compte"
              value={
                site.hosting_account?.account_email ||
                site.hosting_account_email ||
                null
              }
            />
            {(() => {
              const panel =
                site.hosting_account?.panel_url || site.hosting_panel_url;
              return (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    Panneau d'admin
                  </dt>
                  <dd className="text-right">
                    {panel ? (
                      <a
                        href={panel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-bordeaux-600 hover:underline inline-flex items-center gap-1"
                      >
                        Ouvrir
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-gray-800">—</span>
                    )}
                  </dd>
                </div>
              );
            })()}
            <InfoRow icon={Server} label="IP serveur" value={site.server_ip} />
            <InfoRow
              icon={Clock}
              label="Expiration hébergement"
              value={(() => {
                const d =
                  site.hosting_account?.expires_at || site.hosting_expires_at;
                return d ? formatDate(d) : null;
              })()}
            />
            <InfoRow
              icon={Clock}
              label="Intervalle de check"
              value={`${site.check_interval}s`}
            />
            <InfoRow
              icon={Clock}
              label="Timeout"
              value={`${site.timeout_threshold} ms`}
            />
            {site.notes && (
              <div className="pt-2 border-t">
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="text-gray-700 whitespace-pre-wrap">
                  {site.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Historique des checks */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">
            Historique des vérifications
          </h2>
          {recent_checks.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune vérification récente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Temps</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recent_checks.map((check) => (
                    <tr key={check.id}>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeClass(
                            check.status
                          )}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusDotClass(
                              check.status
                            )}`}
                          />
                          {STATUS_LABELS[check.status] || check.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {check.status_code || "—"}
                      </td>
                      <td
                        className={`py-2 pr-4 ${responseTimeColor(
                          check.response_time
                        )}`}
                      >
                        {formatResponseTime(check.response_time)}
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {formatDateTime(check.checked_at)}
                      </td>
                      <td className="py-2 text-gray-500 truncate max-w-xs">
                        {check.error_message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Aperçu + Interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Aperçu du site */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            Aperçu
          </h2>
          {previewError ? (
            <div className="h-56 flex flex-col items-center justify-center text-gray-400 border border-dashed rounded-lg">
              <ImageOff className="w-8 h-8 mb-2" />
              <span className="text-sm">Aperçu indisponible</span>
            </div>
          ) : (
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={previewUrl}
                alt={`Aperçu de ${site.name}`}
                onError={() => setPreviewError(true)}
                className="w-full rounded-lg border hover:opacity-90 transition-opacity"
              />
            </a>
          )}
        </div>

        {/* Interventions */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gray-400" />
              Interventions
            </h2>
            {activeIntervention ? (
              <button
                onClick={() => setShowEndModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
              >
                <Square className="w-4 h-4" />
                Terminer l'intervention
              </button>
            ) : (
              <button
                onClick={() => setShowStartModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 text-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                Démarrer une intervention
              </button>
            )}
          </div>

          {/* Bandeau intervention en cours */}
          {activeIntervention && (
            <div className="mb-4 p-3 rounded-lg bg-bordeaux-50 border border-bordeaux-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-bordeaux-800 truncate">
                    {activeIntervention.title}
                  </div>
                  <div className="text-xs text-bordeaux-600">
                    {INTERVENTION_TYPE_LABELS[
                      activeIntervention.intervention_type
                    ] || activeIntervention.intervention_type}{" "}
                    · depuis {formatDateTime(activeIntervention.started_at)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-lg font-bold text-bordeaux-700 tabular-nums">
                    {formatDuration(
                      elapsedSince(activeIntervention.started_at)
                    )}
                  </div>
                  <div className="text-xs text-bordeaux-500">en cours</div>
                </div>
              </div>
            </div>
          )}

          {/* Historique des interventions */}
          {interventions.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucune intervention enregistrée.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="py-2 pr-4">Intervention</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Début</th>
                    <th className="py-2 pr-4">Durée</th>
                    <th className="py-2">Résolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {interventions.map((iv) => (
                    <tr key={iv.id}>
                      <td className="py-2 pr-4">
                        <div className="font-medium text-gray-800">
                          {iv.title}
                        </div>
                        {iv.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {iv.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {INTERVENTION_TYPE_LABELS[iv.intervention_type] ||
                          iv.intervention_type}
                      </td>
                      <td className="py-2 pr-4 text-gray-500">
                        {formatDateTime(iv.started_at)}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {iv.state === "in_progress" ? (
                          <span className="text-bordeaux-600">en cours</span>
                        ) : (
                          formatDuration(iv.duration_seconds)
                        )}
                      </td>
                      <td className="py-2">
                        {iv.state === "in_progress" ? (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-bordeaux-100 text-bordeaux-700">
                            en cours
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${resolutionBadgeClass(
                              iv.resolution
                            )}`}
                          >
                            {RESOLUTION_LABELS[iv.resolution] || "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Incidents */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-gray-400" />
          Incidents
        </h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun incident enregistré.</p>
        ) : (
          <div className="space-y-2">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100"
              >
                <AlertTriangle
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    incident.status === "resolved"
                      ? "text-gray-300"
                      : "text-bordeaux-600"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {incident.description || "Incident"}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">
                      {incident.severity}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        incident.status === "resolved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {incident.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Début : {formatDateTime(incident.started_at)}
                    {incident.resolved_at &&
                      ` · Résolu : ${formatDateTime(incident.resolved_at)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale : démarrer une intervention */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Démarrer une intervention</h2>
            <form onSubmit={handleStartIntervention}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Mise à jour du CMS…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={startForm.title}
                  onChange={(e) =>
                    setStartForm({ ...startForm, title: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={startForm.intervention_type}
                  onChange={(e) =>
                    setStartForm({
                      ...startForm,
                      intervention_type: e.target.value,
                    })
                  }
                >
                  {INTERVENTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={startForm.description}
                  onChange={(e) =>
                    setStartForm({ ...startForm, description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? "…" : "Démarrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale : terminer une intervention */}
      {showEndModal && activeIntervention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1">Terminer l'intervention</h2>
            <p className="text-sm text-gray-500 mb-4">
              {activeIntervention.title} ·{" "}
              {formatDuration(elapsedSince(activeIntervention.started_at))}
            </p>
            <form onSubmit={handleEndIntervention}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résolution
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={endForm.resolution}
                  onChange={(e) =>
                    setEndForm({ ...endForm, resolution: e.target.value })
                  }
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compte-rendu (optionnel)
                </label>
                <textarea
                  rows="3"
                  placeholder="Détail de ce qui a été fait…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={endForm.description}
                  onChange={(e) =>
                    setEndForm({ ...endForm, description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? "…" : "Terminer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <dt className="flex items-center gap-2 text-gray-500">
      <Icon className="w-4 h-4 text-gray-400" />
      {label}
    </dt>
    <dd className="text-gray-800 text-right">{value || "—"}</dd>
  </div>
);

export default SiteDetail;
