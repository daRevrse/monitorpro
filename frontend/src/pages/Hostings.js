import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  ChevronRight,
  Search,
} from "lucide-react";
import api from "../services/api";
import Pagination from "../components/Pagination";
import {
  statusDotClass,
  expiryInfo,
  toDateInput,
} from "../utils/format";

const emptyForm = {
  name: "",
  provider: "",
  login: "",
  panel_url: "",
  account_email: "",
  expires_at: "",
  notes: "",
};

const Hostings = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async () => {
    try {
      const res = await api.get("/hosting-accounts");
      if (res.data.success) setAccounts(res.data.data);
    } catch (e) {
      console.error("Erreur chargement comptes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, expires_at: form.expires_at || null };
      if (editing) {
        await api.put(`/hosting-accounts/${editing.id}`, payload);
      } else {
        await api.post("/hosting-accounts", payload);
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (acc) => {
    setEditing(acc);
    setForm({
      name: acc.name || "",
      provider: acc.provider || "",
      login: acc.login || "",
      panel_url: acc.panel_url || "",
      account_email: acc.account_email || "",
      expires_at: toDateInput(acc.expires_at),
      notes: acc.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Supprimer ce compte d'hébergement ? Les sites seront détachés (non supprimés)."
      )
    ) {
      try {
        await api.delete(`/hosting-accounts/${id}`);
        load();
      } catch (e) {
        console.error("Erreur suppression compte:", e);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-bordeaux-600"></div>
      </div>
    );
  }

  const totalSites = accounts.reduce((s, a) => s + a.site_count, 0);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? accounts.filter((a) =>
        [a.name, a.provider, a.account_email]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
    : accounts;
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
          <h1 className="text-2xl font-bold text-gray-900">Hébergements</h1>
          <p className="text-gray-600">
            {accounts.length} compte{accounts.length > 1 ? "s" : ""} ·{" "}
            {totalSites} site{totalSites > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditing(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un compte
        </button>
      </div>

      {/* Recherche */}
      {accounts.length > 0 && (
        <div className="relative mb-4 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un compte (nom, hébergeur, email…)"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          <Server className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          Aucun compte d'hébergement.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          Aucun compte ne correspond à « {search} ».
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paginated.map((acc) => {
            const exp = expiryInfo(acc.expires_at);
            return (
              <div
                key={acc.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden"
              >
                {/* En-tête compte */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-bordeaux-100 text-bordeaux-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <Server className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {acc.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {acc.provider || "Hébergeur non précisé"} ·{" "}
                          {acc.site_count} site{acc.site_count > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {acc.panel_url && (
                        <a
                          href={acc.panel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-bordeaux-700"
                          title="Ouvrir le panneau"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleEdit(acc)}
                        className="p-1.5 text-gray-500 hover:text-bordeaux-700"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    {acc.login && <span>Login : {acc.login}</span>}
                    {acc.account_email && <span>{acc.account_email}</span>}
                    {acc.expires_at && (
                      <span className={exp.color}>Expire : {exp.label}</span>
                    )}
                  </div>
                </div>

                {/* Sites du compte */}
                {acc.sites && acc.sites.length > 0 ? (
                  <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                    {acc.sites.map((site) => (
                      <li
                        key={site.id}
                        onClick={() => navigate(`/app/sites/${site.id}`)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-bordeaux-50/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotClass(
                              site.status
                            )}`}
                          />
                          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {site.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {site.url}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!site.is_active && (
                            <span className="text-xs text-gray-400">
                              inactif
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">
                    Aucun site rattaché.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 bg-white rounded-lg border">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
          />
        </div>
        </>
      )}

      {/* Modale création / édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Modifier le compte" : "Ajouter un compte d'hébergement"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du compte *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hébergeur
                  </label>
                  <input
                    type="text"
                    placeholder="OVH, AWS…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={form.provider}
                    onChange={(e) =>
                      setForm({ ...form, provider: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifiant / login
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={form.login}
                    onChange={(e) => setForm({ ...form, login: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email du compte
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={form.account_email}
                    onChange={(e) =>
                      setForm({ ...form, account_email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={form.expires_at}
                    onChange={(e) =>
                      setForm({ ...form, expires_at: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL du panneau (cPanel/Plesk)
                  </label>
                  <input
                    type="url"
                    placeholder="https://panel.hebergeur.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={form.panel_url}
                    onChange={(e) =>
                      setForm({ ...form, panel_url: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                🔒 N'enregistrez pas de mot de passe ici (non chiffré).
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
                >
                  {editing ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hostings;
