import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Calendar,
  FileText,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import api from "../services/api";
import Pagination from "../components/Pagination";
import {
  formatResponseTime,
  responseTimeColor,
  uptimeColor,
  formatUptime,
  formatDuration,
} from "../utils/format";

const PERIOD_LABELS = {
  "1h": "Dernière heure",
  "24h": "Dernières 24h",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
};

const Reports = () => {
  const [period, setPeriod] = useState("24h");
  const [selectedSite, setSelectedSite] = useState("");
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    api
      .get("/websites")
      .then((r) => r.data.success && setSites(r.data.data))
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const params = new URLSearchParams({ period });
      if (selectedSite) params.append("site_id", selectedSite);
      const [statsRes, reportRes] = await Promise.all([
        api.get(`/monitoring/stats?${params}`),
        api.get(`/reports?${params}`),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (reportRes.data.success) setReport(reportRes.data.data);
    } catch (e) {
      console.error("Erreur chargement rapports:", e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedSite]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const downloadExport = async (format) => {
    setExporting(format);
    try {
      const params = new URLSearchParams({ period, format });
      if (selectedSite) params.append("site_id", selectedSite);
      const res = await api.get(`/reports/export?${params}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-monitorpro-${period}.${format}`;
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return period === "7d" || period === "30d"
      ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
      : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const exportButtons = [
    { format: "csv", label: "CSV", icon: FileText },
    { format: "xlsx", label: "Excel", icon: FileSpreadsheet },
    { format: "pdf", label: "PDF", icon: FileDown },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-600">Analyse des performances de monitoring</p>
      </div>

      {/* Contrôles */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {Object.entries(PERIOD_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">Tous les sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exports */}
          <div className="flex items-end gap-2">
            <span className="text-sm text-gray-500 mr-1 pb-2">Exporter :</span>
            {exportButtons.map((b) => {
              const Icon = b.icon;
              return (
                <button
                  key={b.format}
                  onClick={() => downloadExport(b.format)}
                  disabled={exporting === b.format}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-bordeaux-50 hover:border-bordeaux-300 text-sm transition-colors disabled:opacity-60"
                >
                  <Icon className="w-4 h-4 text-bordeaux-600" />
                  {exporting === b.format ? "…" : b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading || !stats || !report ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bordeaux-600"></div>
        </div>
      ) : (
        <>
          {/* Cartes résumé */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={Calendar}
              label="Vérifications"
              value={stats.summary.total_checks.toLocaleString()}
            />
            <SummaryCard
              icon={TrendingUp}
              label="Disponibilité"
              value={`${stats.summary.uptime_percentage}%`}
              valueClass={uptimeColor(stats.summary.uptime_percentage)}
            />
            <SummaryCard
              icon={Clock}
              label="Temps réponse moyen"
              value={formatResponseTime(stats.summary.avg_response_time)}
              valueClass={responseTimeColor(stats.summary.avg_response_time)}
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Incidents"
              value={report.totals.incidents}
              valueClass="text-bordeaux-700"
            />
          </div>

          {/* Graphiques */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              Disponibilité dans le temps
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTimestamp}
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleString("fr-FR")}
                    formatter={(v) => [`${v.toFixed(1)}%`, "Disponibilité"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="uptime_percentage"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              Temps de réponse moyen
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.timeline.filter(
                    (i) => i.avg_response_time !== null
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTimestamp}
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}ms`} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleString("fr-FR")}
                    formatter={(v) => [`${v}ms`, "Temps de réponse"]}
                  />
                  <Bar dataKey="avg_response_time" fill="#9f1239" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau par site */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">
                Détail par site ({report.rows.length})
              </h2>
              <p className="text-xs text-gray-500">
                {report.period_label} · uptime global{" "}
                {formatUptime(report.totals.uptime)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-2">Site</th>
                    <th className="px-4 py-2">Uptime</th>
                    <th className="px-4 py-2">Checks</th>
                    <th className="px-4 py-2">Tps moy</th>
                    <th className="px-4 py-2">Min/Max</th>
                    <th className="px-4 py-2">Incidents</th>
                    <th className="px-4 py-2">Interventions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.rows
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((r) => (
                    <tr key={r.site_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-800">{r.name}</div>
                        {r.hosting_account && (
                          <div className="text-xs text-gray-400">
                            {r.hosting_account}
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-2 font-medium ${uptimeColor(r.uptime)}`}>
                        {formatUptime(r.uptime)}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{r.total_checks}</td>
                      <td className={`px-4 py-2 ${responseTimeColor(r.avg_response)}`}>
                        {formatResponseTime(r.avg_response)}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs">
                        {r.min_response !== null
                          ? `${r.min_response} / ${r.max_response} ms`
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {r.incidents > 0 ? (
                          <span className="text-bordeaux-700 font-medium">
                            {r.incidents}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {r.interventions > 0
                          ? `${r.interventions} · ${formatDuration(
                              r.interventions_duration_seconds
                            )}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={report.rows.length}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, valueClass = "text-gray-900" }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      </div>
      <Icon className="w-7 h-7 text-bordeaux-400" />
    </div>
  </div>
);

export default Reports;
