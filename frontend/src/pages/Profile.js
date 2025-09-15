// src/pages/Profile.js
import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Building,
  Shield,
  Key,
  Bell,
  Save,
  Eye,
  EyeOff,
  Camera,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/common/Button";
import api from "../services/api";

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // États pour les différentes sections
  const [accountData, setAccountData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    company_name: "",
    last_login_at: "",
    email_verified: false,
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [preferencesData, setPreferencesData] = useState({
    email_notifications: true,
    sms_notifications: false,
    slack_notifications: false,
    language: "fr",
    timezone: "Europe/Paris",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await api.get("/auth/profile");
      if (response.data.success) {
        setAccountData(response.data.user);
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      showMessage("error", "Erreur lors du chargement du profil");
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put("/auth/profile", {
        first_name: accountData.first_name,
        last_name: accountData.last_name,
        email: accountData.email,
      });

      if (response.data.success) {
        showMessage("success", "Profil mis à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      showMessage("error", "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      showMessage("error", "Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.new_password.length < 8) {
      showMessage(
        "error",
        "Le mot de passe doit contenir au moins 8 caractères"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.put("/auth/change-password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      if (response.data.success) {
        showMessage("success", "Mot de passe modifié avec succès");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      }
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      showMessage("error", "Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put("/auth/preferences", preferencesData);

      if (response.data.success) {
        showMessage("success", "Préférences mises à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur mise à jour préférences:", error);
      showMessage("error", "Erreur lors de la mise à jour des préférences");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "account", name: "Compte", icon: User },
    { id: "security", name: "Sécurité", icon: Shield },
    { id: "notifications", name: "Notifications", icon: Bell },
  ];

  const getRoleDisplay = (role) => {
    const roles = {
      admin: { name: "Administrateur", color: "text-red-600 bg-red-100" },
      manager: { name: "Manager", color: "text-blue-600 bg-blue-100" },
      technician: { name: "Technicien", color: "text-green-600 bg-green-100" },
      client: { name: "Client", color: "text-purple-600 bg-purple-100" },
    };
    return roles[role] || { name: role, color: "text-gray-600 bg-gray-100" };
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-800 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {accountData.first_name?.[0]}
              {accountData.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {accountData.first_name} {accountData.last_name}
              </h1>
              <p className="text-gray-600">{accountData.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getRoleDisplay(accountData.role).color
                  }`}
                >
                  {getRoleDisplay(accountData.role).name}
                </span>
                {accountData.email_verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Vérifié
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" className="flex items-center">
            <Camera className="w-4 h-4 mr-2" />
            Changer la photo
          </Button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar avec onglets */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary-800 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Onglet Compte */}
            {activeTab === "account" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Informations du compte
                </h2>

                <form onSubmit={handleAccountUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={accountData.first_name}
                        onChange={(e) =>
                          setAccountData({
                            ...accountData,
                            first_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={accountData.last_name}
                        onChange={(e) =>
                          setAccountData({
                            ...accountData,
                            last_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={accountData.email}
                      onChange={(e) =>
                        setAccountData({
                          ...accountData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entreprise
                      </label>
                      <input
                        type="text"
                        value={accountData.company_name || ""}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rôle
                      </label>
                      <input
                        type="text"
                        value={getRoleDisplay(accountData.role).name}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  {accountData.last_login_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dernière connexion
                      </label>
                      <input
                        type="text"
                        value={new Date(
                          accountData.last_login_at
                        ).toLocaleString("fr-FR")}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" loading={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === "security" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Sécurité
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            current_password: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            current: !showPassword.current,
                          })
                        }
                      >
                        {showPassword.current ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        minLength="8"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            new: !showPassword.new,
                          })
                        }
                      >
                        {showPassword.new ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirm_password: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        minLength="8"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            confirm: !showPassword.confirm,
                          })
                        }
                      >
                        {showPassword.confirm ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Conseils pour un mot de passe sécurisé :
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Au moins 8 caractères</li>
                      <li>• Mélange de lettres majuscules et minuscules</li>
                      <li>• Au moins un chiffre</li>
                      <li>• Au moins un caractère spécial</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" loading={loading}>
                      <Key className="w-4 h-4 mr-2" />
                      Changer le mot de passe
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Onglet Notifications */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Préférences de notifications
                </h2>

                <form onSubmit={handlePreferencesUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Types de notifications
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Notifications par email
                          </label>
                          <p className="text-sm text-gray-500">
                            Recevoir les alertes de monitoring par email
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferencesData.email_notifications}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              email_notifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Notifications SMS
                          </label>
                          <p className="text-sm text-gray-500">
                            Recevoir les alertes critiques par SMS
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferencesData.sms_notifications}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              sms_notifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Notifications Slack
                          </label>
                          <p className="text-sm text-gray-500">
                            Envoyer les alertes dans Slack
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferencesData.slack_notifications}
                          onChange={(e) =>
                            setPreferencesData({
                              ...preferencesData,
                              slack_notifications: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Langue
                      </label>
                      <select
                        value={preferencesData.language}
                        onChange={(e) =>
                          setPreferencesData({
                            ...preferencesData,
                            language: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuseau horaire
                      </label>
                      <select
                        value={preferencesData.timezone}
                        onChange={(e) =>
                          setPreferencesData({
                            ...preferencesData,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="Europe/Paris">
                          Europe/Paris (UTC+1)
                        </option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">
                          America/New_York (UTC-5)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" loading={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder les préférences
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
