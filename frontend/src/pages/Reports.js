import React, { useState, useEffect } from "react";
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
  Calendar,
  Download,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";

const Reports = () => {
  const [period, setPeriod] = useState("24h");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState("");
  const [sites, setSites] = useState([]);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadStats();
  }, [period, selectedSite]);

  const loadSites = async () => {
    try {
      const response = await api.get("/websites");
      if (response.data.success) {
        setSites(response.data.data);
      }
    } catch (error) {
      console.error("Erreur chargement sites:", error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (selectedSite) params.append("site_id", selectedSite);

      const response = await api.get(`/monitoring/stats?${params}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    if (period === "1h") {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (period === "24h") {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Rapports et Statistiques
        </h1>
        <p className="text-gray-600">Analyse des performances de monitoring</p>
      </div>

      {/* Contrôles */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="1h">Dernière heure</option>
                <option value="24h">Dernières 24h</option>
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site
              </label>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">Tous les sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Statistiques résumées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Vérifications totales
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.summary.total_checks.toLocaleString()}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibilité</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.summary.uptime_percentage}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Temps de réponse moyen
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.summary.avg_response_time}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Incidents</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.summary.down_checks + stats.summary.warning_checks}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Graphique de disponibilité dans le temps */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Disponibilité dans le temps
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(value).toLocaleString("fr-FR")
                }
                formatter={(value) => [`${value.toFixed(1)}%`, "Disponibilité"]}
              />
              <Line
                type="monotone"
                dataKey="uptime_percentage"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique des temps de réponse */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Temps de réponse moyen
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.timeline.filter(
                (item) => item.avg_response_time !== null
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                interval="preserveStartEnd"
              />
              <YAxis tickFormatter={(value) => `${value}ms`} />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(value).toLocaleString("fr-FR")
                }
                formatter={(value) => [`${value}ms`, "Temps de réponse"]}
              />
              <Bar
                dataKey="avg_response_time"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition des statuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition des statuts
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Opérationnel</span>
              </div>
              <span className="text-sm text-gray-600">
                {stats.summary.up_checks} (
                {(
                  (stats.summary.up_checks / stats.summary.total_checks) *
                  100
                ).toFixed(1)}
                %)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">En panne</span>
              </div>
              <span className="text-sm text-gray-600">
                {stats.summary.down_checks} (
                {(
                  (stats.summary.down_checks / stats.summary.total_checks) *
                  100
                ).toFixed(1)}
                %)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Avertissement</span>
              </div>
              <span className="text-sm text-gray-600">
                {stats.summary.warning_checks} (
                {(
                  (stats.summary.warning_checks / stats.summary.total_checks) *
                  100
                ).toFixed(1)}
                %)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Résumé de la période
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Période analysée</span>
              <span className="text-sm font-medium">
                {period === "1h"
                  ? "Dernière heure"
                  : period === "24h"
                  ? "Dernières 24h"
                  : period === "7d"
                  ? "7 derniers jours"
                  : "30 derniers jours"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sites surveillés</span>
              <span className="text-sm font-medium">
                {selectedSite ? "1 site sélectionné" : `${sites.length} sites`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Meilleure disponibilité
              </span>
              <span className="text-sm font-medium text-green-600">
                {Math.max(
                  ...stats.timeline.map((t) => t.uptime_percentage)
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Temps de réponse le plus rapide
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.min(
                  ...stats.timeline
                    .filter((t) => t.avg_response_time)
                    .map((t) => t.avg_response_time)
                )}
                ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
