// src/App.js (version avec Profile)
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { MonitoringProvider } from "./contexts/MonitoringContext";

// Pages publiques
import Login from "./pages/Login";

// Pages protégées
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import SiteDetail from "./pages/SiteDetail";
import Hostings from "./pages/Hostings";
import Interventions from "./pages/Interventions";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile"; // ✅ Nouvelle page
import Settings from "./pages/Settings";
import UserManagement from "./components/admin/UserManagement";

// Composants
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Styles
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <MonitoringProvider>
        <Router>
          <div className="App">
          <Routes>
            {/* Racine : redirige vers l'app (ou /login si non connecté) */}
            <Route path="/" element={<Navigate to="/app" />} />
            <Route path="/login" element={<Login />} />

            {/* Routes protégées avec préfixe /app */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route
                        path="/"
                        element={<Navigate to="/app/dashboard" />}
                      />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/sites" element={<Sites />} />
                      <Route path="/sites/:id" element={<SiteDetail />} />
                      <Route path="/hostings" element={<Hostings />} />
                      <Route path="/interventions" element={<Interventions />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/users" element={<UserManagement />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirections pour compatibilité */}
            <Route
              path="/dashboard"
              element={<Navigate to="/app/dashboard" />}
            />
            <Route path="/sites" element={<Navigate to="/app/sites" />} />
            <Route path="/reports" element={<Navigate to="/app/reports" />} />
            <Route path="/profile" element={<Navigate to="/app/profile" />} />
            <Route path="/users" element={<Navigate to="/app/users" />} />

            {/* Route 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </div>
        </Router>
      </MonitoringProvider>
    </AuthProvider>
  );
}

export default App;
