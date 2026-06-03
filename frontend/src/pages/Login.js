import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Activity, Bell, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Logo, LogoMark } from "../assets/logo";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await login(formData.email, formData.password);
    setLoading(false);
    if (res?.success) {
      navigate("/app/dashboard");
    } else {
      setError(res?.message || "Identifiants invalides");
    }
  };

  const features = [
    { icon: Activity, text: "Surveillance HTTP/HTTPS & SSL en temps réel" },
    { icon: Bell, text: "Alertes instantanées en cas d'incident" },
    { icon: ShieldCheck, text: "Suivi des hébergements et interventions" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Panneau de marque */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-bordeaux-800 via-bordeaux-900 to-bordeaux-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <LogoMark size={40} />
          <span className="text-2xl font-bold tracking-tight">
            Monitor<span className="text-bordeaux-300">Pro</span>
          </span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Surveillez. Alertez.
            <br />
            Réagissez.
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-md">
            La plateforme de supervision de vos sites web et hébergements.
          </p>
          <ul className="space-y-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-white/90">{f.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative text-sm text-white/50">
          © {new Date().getFullYear()} MonitorPro
        </div>
      </div>

      {/* Panneau formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size={40} />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
              <p className="text-gray-500 mt-1">
                Accédez à votre tableau de bord
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-bordeaux-600 focus:ring-bordeaux-500 border-gray-300 rounded"
                  />
                  Se souvenir de moi
                </label>
                <span className="text-sm text-gray-400">
                  Mot de passe oublié ?
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.email || !formData.password}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bordeaux-700 text-white font-medium rounded-lg hover:bg-bordeaux-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
