import React, { useState, useEffect } from "react";
import { Users, Mail, Activity, Save, Send, CheckCircle } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import UserManagement from "../components/admin/UserManagement";

const TABS = [
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "alerts", label: "Alertes / SMTP", icon: Mail },
  { id: "monitoring", label: "Monitoring", icon: Activity },
];

const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500";

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState("users");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState(user?.email || "");
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await api.get("/settings");
        if (res.data.success) setSettings(res.data.data);
      } catch (e) {
        console.error("Erreur chargement paramètres:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const setField = (key, value) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = { ...settings };
      delete payload.smtp_pass_set;
      // Ne pas envoyer un mot de passe vide (conserve l'existant)
      if (!payload.smtp_pass) delete payload.smtp_pass;
      const res = await api.put("/settings", payload);
      if (res.data.success) {
        setSettings(res.data.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestStatus("sending");
    try {
      await api.post("/settings/test-email", { email: testEmail });
      setTestStatus("ok");
    } catch (e) {
      setTestStatus("error");
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

  const SaveBar = () => (
    <div className="flex items-center gap-3 mt-6">
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-bordeaux-600 text-white rounded-lg hover:bg-bordeaux-700 transition-colors disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
      {saved && (
        <span className="flex items-center gap-1 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          Enregistré
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-bordeaux-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600">Configuration de la plateforme</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-bordeaux-600 text-bordeaux-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Utilisateurs : accessible à tous (la route backend gère les droits) */}
      {tab === "users" && <UserManagement />}

      {/* Onglets admin uniquement */}
      {tab !== "users" && !isAdmin && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          Section réservée aux administrateurs.
        </div>
      )}

      {tab === "alerts" && isAdmin && settings && (
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-800 mb-4">
            Serveur d'envoi (SMTP)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Hôte SMTP">
              <input
                className={inputClass}
                value={settings.smtp_host || ""}
                onChange={(e) => setField("smtp_host", e.target.value)}
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                className={inputClass}
                value={settings.smtp_port || ""}
                onChange={(e) =>
                  setField("smtp_port", parseInt(e.target.value) || null)
                }
              />
            </Field>
            <Field label="Utilisateur">
              <input
                className={inputClass}
                value={settings.smtp_user || ""}
                onChange={(e) => setField("smtp_user", e.target.value)}
              />
            </Field>
            <Field
              label="Mot de passe"
              hint={
                settings.smtp_pass_set
                  ? "Défini — laisser vide pour conserver l'actuel"
                  : "Non défini"
              }
            >
              <input
                type="password"
                placeholder={settings.smtp_pass_set ? "••••••••" : ""}
                className={inputClass}
                value={settings.smtp_pass || ""}
                onChange={(e) => setField("smtp_pass", e.target.value)}
              />
            </Field>
            <Field label="Expéditeur (from)">
              <input
                type="email"
                className={inputClass}
                value={settings.smtp_from || ""}
                onChange={(e) => setField("smtp_from", e.target.value)}
              />
            </Field>
            <Field label="Connexion sécurisée (SSL/TLS)">
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={!!settings.smtp_secure}
                  onChange={(e) => setField("smtp_secure", e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  Port 465 / SSL direct
                </span>
              </label>
            </Field>
          </div>

          <h2 className="font-semibold text-gray-800 mt-6 mb-4">
            Alertes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Webhook Slack">
              <input
                className={inputClass}
                placeholder="https://hooks.slack.com/…"
                value={settings.slack_webhook_url || ""}
                onChange={(e) => setField("slack_webhook_url", e.target.value)}
              />
            </Field>
            <Field
              label="Cooldown entre alertes (minutes)"
              hint="Délai minimum entre deux alertes pour un même site"
            >
              <input
                type="number"
                min="0"
                className={inputClass}
                value={Math.round((settings.alert_cooldown || 0) / 60000)}
                onChange={(e) =>
                  setField(
                    "alert_cooldown",
                    (parseInt(e.target.value) || 0) * 60000
                  )
                }
              />
            </Field>
          </div>

          <SaveBar />

          {/* Test email */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Tester l'envoi
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="email"
                className={`${inputClass} max-w-xs`}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
              <button
                onClick={handleTestEmail}
                disabled={testStatus === "sending"}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {testStatus === "sending" ? "Envoi…" : "Envoyer un test"}
              </button>
              {testStatus === "ok" && (
                <span className="text-green-600 text-sm">Envoyé ✓</span>
              )}
              {testStatus === "error" && (
                <span className="text-red-600 text-sm">Échec ✗</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Enregistrez d'abord vos paramètres avant de tester.
            </p>
          </div>
        </div>
      )}

      {tab === "monitoring" && isAdmin && settings && (
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
          <h2 className="font-semibold text-gray-800 mb-4">
            Valeurs par défaut des nouveaux sites
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Intervalle de vérification (s)"
              hint="Entre 60 et 86400"
            >
              <input
                type="number"
                min="60"
                max="86400"
                className={inputClass}
                value={settings.default_check_interval || ""}
                onChange={(e) =>
                  setField(
                    "default_check_interval",
                    parseInt(e.target.value) || 0
                  )
                }
              />
            </Field>
            <Field label="Timeout (ms)" hint="Entre 1000 et 120000">
              <input
                type="number"
                min="1000"
                max="120000"
                className={inputClass}
                value={settings.default_timeout || ""}
                onChange={(e) =>
                  setField("default_timeout", parseInt(e.target.value) || 0)
                }
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={!!settings.default_ssl_check}
              onChange={(e) => setField("default_ssl_check", e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              Vérifier le certificat SSL par défaut
            </span>
          </label>
          <SaveBar />
        </div>
      )}
    </div>
  );
};

export default Settings;
