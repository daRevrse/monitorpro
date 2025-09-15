import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, User, Shield, RefreshCw } from "lucide-react";
import api from "../../services/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "technician",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get("/auth/users"); // Route à créer
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.id}`, formData);
      } else {
        await api.post("/auth/register", formData);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error("Erreur sauvegarde utilisateur:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "technician",
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-500" />;
      case "manager":
        return <User className="w-4 h-4 text-blue-500" />;
      case "technician":
        return <User className="w-4 h-4 text-green-500" />;
      case "client":
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600">Gérez les accès à votre plateforme</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingUser(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-sm">
                        {user.first_name[0]}
                        {user.last_name[0]}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="text-sm capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setFormData({
                            email: user.email,
                            password: "",
                            first_name: user.first_name,
                            last_name: user.last_name,
                            role: user.role,
                          });
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser
                    ? "Nouveau mot de passe (optionnel)"
                    : "Mot de passe"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="technician">Technicien</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors"
                >
                  {editingUser ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
