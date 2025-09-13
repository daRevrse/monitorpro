import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "./AuthContext";
import wsService from "../services/websocket";

const MonitoringContext = createContext();

const monitoringReducer = (state, action) => {
  switch (action.type) {
    case "SET_SITES":
      return { ...state, sites: action.payload };
    case "UPDATE_SITE_STATUS":
      return {
        ...state,
        sites: state.sites.map((site) =>
          site.id === action.payload.id
            ? {
                ...site,
                status: action.payload.status,
                last_check: action.payload.last_check,
              }
            : site
        ),
      };
    case "ADD_INCIDENT":
      return {
        ...state,
        incidents: [action.payload, ...state.incidents],
      };
    case "RESOLVE_INCIDENT":
      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.payload.id
            ? {
                ...incident,
                status: "resolved",
                resolved_at: action.payload.resolved_at,
              }
            : incident
        ),
      };
    case "SET_CONNECTION_STATUS":
      return { ...state, wsConnected: action.payload };
    default:
      return state;
  }
};

export const MonitoringProvider = ({ children }) => {
  const [state, dispatch] = useReducer(monitoringReducer, {
    sites: [],
    incidents: [],
    wsConnected: false,
  });

  const { accessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Connecter WebSocket
      wsService.connect(accessToken);
      wsService.subscribeToMonitoring();

      // Écouter les événements WebSocket
      const handleConnection = (data) => {
        dispatch({
          type: "SET_CONNECTION_STATUS",
          payload: data.status === "connected",
        });
      };

      const handleSiteStatusChange = (data) => {
        dispatch({ type: "UPDATE_SITE_STATUS", payload: data });
      };

      const handleNewIncident = (data) => {
        dispatch({ type: "ADD_INCIDENT", payload: data });
      };

      const handleIncidentResolved = (data) => {
        dispatch({ type: "RESOLVE_INCIDENT", payload: data });
      };

      wsService.on("connection", handleConnection);
      wsService.on("site_status_change", handleSiteStatusChange);
      wsService.on("new_incident", handleNewIncident);
      wsService.on("incident_resolved", handleIncidentResolved);

      return () => {
        wsService.off("connection", handleConnection);
        wsService.off("site_status_change", handleSiteStatusChange);
        wsService.off("new_incident", handleNewIncident);
        wsService.off("incident_resolved", handleIncidentResolved);
        wsService.unsubscribeFromMonitoring();
        wsService.disconnect();
      };
    }
  }, [isAuthenticated, accessToken]);

  const updateSites = (sites) => {
    dispatch({ type: "SET_SITES", payload: sites });
  };

  return (
    <MonitoringContext.Provider
      value={{
        ...state,
        updateSites,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error("useMonitoring doit être utilisé dans MonitoringProvider");
  }
  return context;
};
