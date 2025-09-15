import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Logo } from "../assets/logo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isAuthenticated, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Logo et titre avec bordeaux */}
        <div className="text-center mb-8">
          {/* <div className="w-16 h-16 bg-bordeaux-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
            MP
          </div> */}
          <div
            style={{
              width: "300px",
              height: "100px",
              margin: "0 auto",
            }}
          >
            <Logo />
          </div>
          <h2 className="text-3xl font-bold text-bordeaux-800">MonitorPro</h2>
          <p className="text-bordeaux-500 mt-2">Surveillance de sites web</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-bordeaux-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-bordeaux-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bordeaux-500 focus:border-bordeaux-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-bordeaux-600 text-white py-3 px-4 rounded-lg hover:bg-bordeaux-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Problème de connexion ?
            <span className="text-bordeaux-600 hover:text-bordeaux-700 cursor-pointer ml-1">
              Contactez l'administrateur
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
