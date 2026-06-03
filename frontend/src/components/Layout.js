import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMonitoring } from "../contexts/MonitoringContext";
import { Logo } from "./../assets/logo";
import {
  Home,
  Monitor,
  Server,
  Wrench,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { incidents } = useMonitoring();
  const location = useLocation();
  const navigate = useNavigate();

  // Incidents non résolus = notifications actives
  const activeIncidents = (incidents || []).filter(
    (incident) => incident.status !== "resolved"
  );
  const notificationCount = activeIncidents.length;

  const formatIncidentDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Home, path: "/app/dashboard" },
    { id: "sites", name: "Sites Web", icon: Monitor, path: "/app/sites" },
    { id: "hostings", name: "Hébergements", icon: Server, path: "/app/hostings" },
    { id: "interventions", name: "Interventions", icon: Wrench, path: "/app/interventions" },
    { id: "reports", name: "Rapports", icon: BarChart3, path: "/app/reports" },
    { id: "settings", name: "Paramètres", icon: SettingsIcon, path: "/app/settings" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Titre de la page courante (gère aussi les sous-routes)
  const getPageTitle = (pathname) => {
    const exact = menuItems.find((item) => item.path === pathname);
    if (exact) return exact.name;
    if (pathname.startsWith("/app/sites/")) return "Détail du site";
    if (pathname.startsWith("/app/profile")) return "Mon profil";
    if (pathname.startsWith("/app/settings")) return "Paramètres";
    return "MonitorPro";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar avec thème bordeaux */}
      <div
        className={`bg-white flex flex-col justify-between shadow-lg transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-18"
        }`}
      >
        <div>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div
                className={`font-bold text-xl text-bordeaux-800 ${
                  !sidebarOpen && "hidden"
                }`}
              >
                MonitorPro
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-bordeaux-50 transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-bordeaux-600" />
                ) : (
                  <Menu className="w-5 h-5 text-bordeaux-600" />
                )}
              </button>
            </div>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-bordeaux-50 text-bordeaux-800 border border-bordeaux-200"
                          : "text-gray-600 hover:bg-bordeaux-50 hover:text-bordeaux-700"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="p-6 border-t text-sm text-gray-500 bottom-0">
          <div className={!sidebarOpen && "hidden"}>
            <Logo />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation avec bordeaux */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-bordeaux-800">
                {getPageTitle(location.pathname)}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications avec bordeaux */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg hover:bg-bordeaux-50 transition-colors"
                >
                  <Bell className="w-5 h-5 text-bordeaux-600" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-bordeaux-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <span className="font-semibold text-bordeaux-800">
                        Notifications
                      </span>
                      {notificationCount > 0 && (
                        <span className="text-xs bg-bordeaux-100 text-bordeaux-700 px-2 py-0.5 rounded-full">
                          {notificationCount} active
                          {notificationCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notificationCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                          <span className="text-sm">Aucune alerte active</span>
                        </div>
                      ) : (
                        activeIncidents.map((incident) => (
                          <div
                            key={incident.id}
                            className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-bordeaux-600 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-800 truncate">
                                  {incident.website?.name ||
                                    incident.website?.url ||
                                    "Site inconnu"}
                                </div>
                                <div className="text-sm text-gray-600 truncate">
                                  {incident.description || "Incident détecté"}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {formatIncidentDate(incident.started_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu avec bordeaux */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-bordeaux-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-bordeaux-600 text-white rounded-full flex items-center justify-center font-medium">
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-bordeaux-800">
                      {user?.name}
                    </div>
                    <div className="text-sm text-bordeaux-500">
                      {user?.role}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-bordeaux-400" />
                </button>

                {/* Profile Dropdown avec bordeaux */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/app/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Mon Profil
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Overlay */}
      {(profileMenuOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setProfileMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout;
