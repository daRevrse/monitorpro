// contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from "react";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.access_token,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: null,
        loading: false,
      };
    case "UPDATE_TOKEN":
      return { ...state, accessToken: action.payload };
    case "INIT_DONE":
      return { ...state, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    loading: true, // true tant que la session initiale n'est pas vérifiée
    error: null,
  });

  // Vérifie un token et restaure l'utilisateur ; renvoie true si OK
  const verifyToken = async (token) => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: data.user, access_token: token },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur lors de la vérification du token:", error);
      return false;
    }
  };

  useEffect(() => {
    // Restauration de session au démarrage
    const init = async () => {
      const token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      try {
        if (token && (await verifyToken(token))) {
          return; // session restaurée
        }
        if (refreshToken) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            await verifyToken(newToken);
          }
        }
      } finally {
        dispatch({ type: "INIT_DONE" });
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token);

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: data,
        });
        return { success: true };
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: data.message,
        });
        return { success: false, message: data.message };
      }
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: "Erreur de connexion",
      });
      return { success: false, message: "Erreur de connexion" };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    dispatch({ type: "LOGOUT" });
  };

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.access_token);
        dispatch({ type: "UPDATE_TOKEN", payload: data.access_token });
        return data.access_token;
      } else {
        logout();
      }
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
};
