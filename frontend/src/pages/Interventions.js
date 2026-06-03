import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Edit, Trash2, Square, Search, ExternalLink } from "lucide-react";
import api from "../services/api";
import Pagination from "../components/Pagination";
import {
  INTERVENTION_TYPES,
  INTERVENTION_TYPE_LABELS,
  RESOLUTIONS,
  RESOLUTION_LABELS,
  resolutionBadgeClass,
  formatDuration,
  formatDateTime,
} from "../utils/format";

const Interventions = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    intervention_type: "maintenance",
    description: "",
    resolution: "",
  });
  const [closing, setClosing] = useState(null);
  const [closeResolution, setCloseResolution] = useState("resolved");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stateFilter) params.append("state", stateFilter);
      if (typeFilter) params.append("intervention_type", typeFilter);
      const res = await api.get(`/interventions?${params}`);
      if (res.data.success) setItems(res.data.data);
      setPage(1);
    } catch (e) {
      console.error("Erreur chargement interventions:", e);
    } finally {
      setLoading(false);
    }
  }, [stateFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (iv) => {
    setEditing(iv);
    setEditForm({
      title: iv.title,
      intervention_type: iv.intervention_type,
      description: iv.description || "",
      resolution: iv.resolution || "",
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/interventions/${editing.id}`, {
        title: editForm.title,
        intervention_type: editForm.intervention_type,
        description: editForm.description || null,
        ...(editForm.resolution ? { resolution: editForm.resolution } : {}),
      });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const submitClose = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/interventions/${closing.id}/end`, {
        resolution: closeResolution,
      });
      setClosing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la clôture");
    }
  };

  const handleDelete = async (iv) => {
    if (window.confirm(`Supprimer l'intervention « ${iv.title} » ?`)) {
      try {
        await api.delete(`/interventions/${iv.id}`);
        load();
      } catch (err) {
        alert(err.response?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((i) =>
        [i.title, i.description, i.website?.name, i.technician]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
    : items;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const inputClass =
    "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
        <p className="text-gray-600">
          {items.length} intervention{items.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (titre, site, technicien…)"
            className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className={inputClass}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">Tous les états</option>
          <option value="in_progress">En cours</option>
          <option value="ended">Terminées</option>
        </select>
        <select
          className={inputClass}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Tous les types</option>
          {INTERVENTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bordeaux-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          Aucune intervention.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Intervention</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Début</th>
                  <th className="px-4 py-3">Durée</th>
                  <th className="px-4 py-3">État</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((iv) => (
                  <tr key={iv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{iv.title}</div>
                      {iv.technician && (
                        <div className="text-xs text-gray-400">
                          {iv.technician}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {iv.website ? (
                        <button
                          onClick={() => navigate(`/app/sites/${iv.website.id}`)}
                          className="text-bordeaux-600 hover:underline inline-flex items-center gap-1"
                        >
                          {iv.website.name}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {INTERVENTION_TYPE_LABELS[iv.intervention_type] ||
                        iv.intervention_type}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDateTime(iv.started_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {iv.state === "in_progress" ? (
                        <span className="text-bordeaux-600">en cours</span>
                      ) : (
                        formatDuration(iv.duration_seconds)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {iv.state === "in_progress" ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-bordeaux-100 text-bordeaux-700">
                          En cours
                        </span>
                      ) : (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${resolutionBadgeClass(
                            iv.resolution
                          )}`}
                        >
                          {RESOLUTION_LABELS[iv.resolution] || "Terminée"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {iv.state === "in_progress" && (
                          <button
                            onClick={() => {
                              setClosing(iv);
                              setCloseResolution("resolved");
                            }}
                            className="text-gray-500 hover:text-green-600"
                            title="Clôturer"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(iv)}
                          className="text-gray-500 hover:text-bordeaux-700"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(iv)}
                          className="text-gray-500 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Modale édition */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Modifier l'intervention</h2>
            <form onSubmit={submitEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={editForm.intervention_type}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
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
              {editing.state === "ended" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Résolution
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                    value={editForm.resolution}
                    onChange={(e) =>
                      setEditForm({ ...editForm, resolution: e.target.value })
                    }
                  >
                    <option value="">—</option>
                    {RESOLUTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale clôture */}
      {closing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-1">Clôturer l'intervention</h2>
            <p className="text-sm text-gray-500 mb-4">{closing.title}</p>
            <form onSubmit={submitClose}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Résolution
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500"
                  value={closeResolution}
                  onChange={(e) => setCloseResolution(e.target.value)}
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClosing(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700"
                >
                  Clôturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interventions;
