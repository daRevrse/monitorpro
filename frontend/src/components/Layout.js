import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./../assets/logo";
import {
  Home,
  Monitor,
  Users,
  BarChart3,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Home, path: "/dashboard" },
    { id: "sites", name: "Sites Web", icon: Monitor, path: "/sites" },
    { id: "users", name: "Utilisateurs", icon: Users, path: "/users" },
    { id: "reports", name: "Rapports", icon: BarChart3, path: "/reports" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar avec thème bordeaux */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-18"
        }`}
      >
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

        <div className="p-6 border-t text-sm text-gray-500">
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
                {menuItems.find((item) => item.path === location.pathname)
                  ?.name || "MonitorPro"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications avec bordeaux */}
              <button className="relative p-2 rounded-lg hover:bg-bordeaux-50 transition-colors">
                <Bell className="w-5 h-5 text-bordeaux-600" />
                <span className="absolute -top-1 -right-1 bg-bordeaux-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <div className="font-medium text-bordeaux-800">
                        {user?.name}
                      </div>
                      <div className="text-sm text-bordeaux-500">
                        {user?.email}
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bordeaux-50 transition-colors">
                        <User className="w-4 h-4 text-bordeaux-600" />
                        <span className="text-bordeaux-700">Mon Profil</span>
                      </button>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
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
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
