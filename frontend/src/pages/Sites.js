import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  Shield,
  ShieldAlert,
  Server,
  ChevronRight,
  Search,
} from "lucide-react";
import api from "../services/api";
import Pagination from "../components/Pagination";
import {
  STATUS_LABELS,
  statusBadgeClass,
  statusDotClass,
  formatResponseTime,
  responseTimeColor,
  formatUptime,
  uptimeColor,
  formatRelative,
  expiryInfo,
  toDateInput,
} from "../utils/format";

const SITE_TYPES = [
  "Vitrine",
  "E-commerce",
  "Blog",
  "Application web",
  "API",
  "Landing page",
  "Intranet",
  "Autre",
];

const emptyForm = {
  name: "",
  url: "",
  client_name: "",
  hosting_account_id: "",
  site_type: "",
  hosting_provider: "",
  hosting_account: "",
  hosting_panel_url: "",
  hosting_account_email: "",
  hosting_expires_at: "",
  server_ip: "",
  notes: "",
  check_interval: 300,
  timeout_threshold: 10000,
  ssl_check: true,
};

const Sites = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [hostingAccounts, setHostingAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    loadSites();
    loadHostingAccounts();
  }, []);

  const loadHostingAccounts = async () => {
    try {
      const res = await api.get("/hosting-accounts");
      if (res.data.success) setHostingAccounts(res.data.data);
    } catch (e) {
      console.error("Erreur chargement comptes hébergement:", e);
    }
  };

  const loadSites = async () => {
    try {
      const response = await api.get("/websites");
      if (response.data.success) {
        setSites(response.data.data);
      }
    } catch (error) {
      console.error("Erreur chargement sites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        // n'envoyer que des valeurs propres
        hosting_expires_at: formData.hosting_expires_at || null,
        hosting_account_id: formData.hosting_account_id || null,
      };
      if (editingSite) {
        await api.put(`/websites/${editingSite.id}`, payload);
      } else {
        await api.post("/websites", payload);
      }
      setShowModal(false);
      setEditingSite(null);
      setFormData(emptyForm);
      loadSites();
    } catch (error) {
      console.error("Erreur sauvegarde site:", error);
      alert(
        error.response?.data?.message ||
          "Erreur lors de l'enregistrement du site"
      );
    }
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      client_name: site.client_name || "",
      hosting_account_id: site.hosting_account_id || "",
      site_type: site.site_type || "",
      hosting_provider: site.hosting_provider || "",
      hosting_account: site.hosting_account || "",
      hosting_panel_url: site.hosting_panel_url || "",
      hosting_account_email: site.hosting_account_email || "",
      hosting_expires_at: toDateInput(site.hosting_expires_at),
      server_ip: site.server_ip || "",
      notes: site.notes || "",
      check_interval: site.check_interval,
      timeout_threshold: site.timeout_threshold,
      ssl_check: site.ssl_check,
    });
    setShowModal(true);
  };

  const handleDelete = async (siteId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce site ?")) {
      try {
        await api.delete(`/websites/${siteId}`);
        loadSites();
      } catch (error) {
        console.error("Erreur suppression site:", error);
      }
    }
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setEditingSite(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-bordeaux-600"></div>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? sites.filter((s) =>
        [s.name, s.url, s.client_name, s.hosting_account?.name, s.site_type]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
    : sites;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites Web</h1>
          <p className="text-gray-600">
            {sites.length} site{sites.length > 1 ? "s" : ""} surveillé
            {sites.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un site
        </button>
      </div>

      {/* Recherche */}
      {sites.length > 0 && (
        <div className="relative mb-4 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, URL, client, hébergement…)"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      )}

      {sites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          <Globe className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          Aucun site surveillé pour le moment.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          Aucun site ne correspond à « {search} ».
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Site",
                    "Statut",
                    "Uptime 24h",
                    "Temps réponse",
                    "SSL",
                    "Dernier check",
                    "Hébergement",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((site) => {
                  const ssl = expiryInfo(site.ssl_expires_at);
                  return (
                    <tr
                      key={site.id}
                      onClick={() => navigate(`/app/sites/${site.id}`)}
                      className="hover:bg-bordeaux-50/40 cursor-pointer transition-colors"
                    >
                      {/* Site */}
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {site.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {site.url}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {site.client_name && (
                                <span className="text-xs text-gray-400">
                                  {site.client_name}
                                </span>
                              )}
                              {site.site_type && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {site.site_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Statut */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${statusBadgeClass(
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
                      </td>
                      {/* Uptime */}
                      <td
                        className={`px-4 py-3 whitespace-nowrap font-medium ${uptimeColor(
                          site.uptime_24h
                        )}`}
                      >
                        {formatUptime(site.uptime_24h)}
                      </td>
                      {/* Temps réponse */}
                      <td
                        className={`px-4 py-3 whitespace-nowrap ${responseTimeColor(
                          site.last_response_time
                        )}`}
                      >
                        {formatResponseTime(site.last_response_time)}
                      </td>
                      {/* SSL */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {!site.ssl_check ? (
                          <span className="text-xs text-gray-400">Désactivé</span>
                        ) : site.ssl_expires_at ? (
                          <span
                            className={`inline-flex items-center gap-1 text-sm ${ssl.color}`}
                          >
                            {site.ssl_valid === false ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                            {ssl.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      {/* Dernier check */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatRelative(site.last_check)}
                        </div>
                        {site.last_status_code && (
                          <div className="text-xs text-gray-400">
                            HTTP {site.last_status_code}
                          </div>
                        )}
                      </td>
                      {/* Hébergement */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {site.hosting_provider ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Server className="w-4 h-4 text-gray-400" />
                            {site.hosting_provider}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(site);
                            }}
                            className="text-gray-500 hover:text-bordeaux-700"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(site.id);
                            }}
                            className="text-gray-500 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingSite ? "Modifier le site" : "Ajouter un site"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du site *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://exemple.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                      value={formData.client_name}
                      onChange={(e) =>
                        setFormData({ ...formData, client_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de site
                    </label>
                    <input
                      type="text"
                      list="site-types"
                      placeholder="Vitrine, E-commerce…"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                      value={formData.site_type}
                      onChange={(e) =>
                        setFormData({ ...formData, site_type: e.target.value })
                      }
                    />
                    <datalist id="site-types">
                      {SITE_TYPES.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL du panneau admin
                      </label>
                      <input
                        type="url"
                        placeholder="https://monsite.com/admin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.hosting_panel_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hosting_panel_url: e.target.value,
                          })
                        }
                      />
                    </div>
                </div>

                {/* Bloc Hébergement */}
                <div className="mt-5 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    Hébergement
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compte d'hébergement
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.hosting_account_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hosting_account_id: e.target.value,
                          })
                        }
                      >
                        <option value="">— Aucun —</option>
                        {hostingAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                            {acc.provider ? ` (${acc.provider})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hébergeur
                      </label>
                      <input
                        type="text"
                        placeholder="OVH, AWS, o2switch…"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.hosting_provider}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hosting_provider: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IP serveur
                      </label>
                      <input
                        type="text"
                        placeholder="192.0.2.10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.server_ip}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            server_ip: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration hébergement
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.hosting_expires_at}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hosting_expires_at: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compte d'hébergement
                      </label>
                      <input
                        type="text"
                        placeholder="login / réf. client"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.hosting_account}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hosting_account: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email du compte
                      </label>
                      <input
                        type="email"
                        placeholder="compte@exemple.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.hosting_account_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hosting_account_email: e.target.value,
                          })
                        }
                      />
                    </div> */}
                  </div>
                  {/* <p className="text-xs text-gray-400 mt-2">
                    🔒 Ne saisissez pas de mot de passe ici (non chiffré).
                  </p> */}
                </div>

                {/* Bloc Surveillance */}
                <div className="mt-5 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Surveillance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intervalle de vérification (s)
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="86400"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.check_interval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            check_interval: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        max="120000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                        value={formData.timeout_threshold}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            timeout_threshold: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.ssl_check}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ssl_check: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Vérifier le certificat SSL
                    </span>
                  </label>
                </div>

                {/* Notes */}
                <div className="mt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSite(null);
                      setFormData(emptyForm);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
                  >
                    {editingSite ? "Modifier" : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sites;
