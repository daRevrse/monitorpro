// frontend/src/AppAuthenticated.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Pages de l'application
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import Reports from "./pages/Reports";
import UserManagement from "./components/admin/UserManagement";

function AppAuthenticated() {
  return (
    <ProtectedRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/app/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

export default AppAuthenticated;
