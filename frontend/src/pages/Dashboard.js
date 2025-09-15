import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Settings,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const [sites, setSites] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    up: 0,
    down: 0,
    warning: 0,
    maintenance: 0,
  });
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get("/monitoring/dashboard");
      if (response.data.success) {
        setSites(response.data.data.sites);
        setStats(response.data.data.stats);
        setIncidents(response.data.data.incidents);
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "up":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "down":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "maintenance":
        return <Settings className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "up":
        return "bg-green-100 border-green-300";
      case "down":
        return "bg-red-100 border-red-300";
      case "warning":
        return "bg-yellow-100 border-yellow-300";
      case "maintenance":
        return "bg-blue-100 border-blue-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const filteredSites = sites.filter((site) => {
    const matchesFilter = filter === "all" || site.status === filter;
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.client_name &&
        site.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const forceCheck = async (siteId) => {
    try {
      await api.post(`/monitoring/sites/${siteId}/check`);
      // Actualiser les données après 2 secondes
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error("Erreur vérification forcée:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard de Monitoring
        </h1>
        <p className="text-gray-600">
          Surveillance en temps réel de {sites.length} sites web
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sites</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Wifi className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Opérationnels</p>
              <p className="text-2xl font-bold text-green-600">{stats.up}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Panne</p>
              <p className="text-2xl font-bold text-red-600">{stats.down}</p>
            </div>
            <WifiOff className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.warning}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un site..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm 
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             transition duration-200 ease-in-out cursor-pointer hover:border-gray-400"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">🌐 Tous les statuts</option>
              <option value="up">✅ Opérationnel</option>
              <option value="down">❌ En panne</option>
              <option value="warning">⚠️ Alerte</option>
              <option value="maintenance">🔧 Maintenance</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-bordeaux-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-bordeaux-50 hover:text-bordeaux-700"
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Sites Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${getStatusColor(
                site.status
              )}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(site.status)}
                  <span className="font-medium text-gray-900 text-sm">
                    {site.name}
                  </span>
                </div>
                <button
                  onClick={() => forceCheck(site.id)}
                  className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                  title="Forcer une vérification"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  URL: <span className="font-medium">{site.url}</span>
                </div>
                {site.client_name && (
                  <div>
                    Client:{" "}
                    <span className="font-medium">{site.client_name}</span>
                  </div>
                )}
                <div>
                  Temps:{" "}
                  <span className="font-medium">
                    {site.response_time || "N/A"}
                  </span>
                </div>
                <div className="text-xs">
                  Vérifié:{" "}
                  {site.last_check
                    ? new Date(site.last_check).toLocaleTimeString()
                    : "Jamais"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temps Réponse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière Vérif.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSites.slice(0, 50).map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {site.name}
                      </div>
                      {site.client_name && (
                        <div className="text-sm text-gray-500">
                          {site.client_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {site.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(site.status)}
                        <span className="text-sm capitalize">
                          {site.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.response_time || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {site.last_check
                        ? new Date(site.last_check).toLocaleString()
                        : "Jamais"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => forceCheck(site.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Vérifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incidents récents */}
      {incidents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Incidents Récents
          </h2>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {incident.website.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {incident.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(incident.started_at).toLocaleString()}
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        incident.severity === "critical"
                          ? "bg-red-200 text-red-800"
                          : incident.severity === "high"
                          ? "bg-orange-200 text-orange-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {incident.severity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        Affichage de{" "}
        {Math.min(
          filteredSites.length,
          viewMode === "list" ? 50 : filteredSites.length
        )}{" "}
        sur {filteredSites.length} sites
      </div>
    </div>
  );
};

export default Dashboard;
