// src/App.js (version avec Profile)
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Pages publiques
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Pages protégées
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile"; // ✅ Nouvelle page
import UserManagement from "./components/admin/UserManagement";

// Composants
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Styles
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

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
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/profile" element={<Profile />} />{" "}
                      {/* ✅ Nouvelle route */}
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
    </AuthProvider>
  );
}

export default App;
