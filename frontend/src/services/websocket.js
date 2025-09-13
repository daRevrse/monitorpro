import { io } from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:3001";

    this.socket = io(WS_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connecté");
      this.isConnected = true;
      this.emit("connection", { status: "connected" });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket déconnecté:", reason);
      this.isConnected = false;
      this.emit("connection", { status: "disconnected", reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("Erreur connexion WebSocket:", error);
      this.emit("connection", { status: "error", error });
    });

    // Écouter les événements de monitoring
    this.socket.on("site_status_change", (data) => {
      this.emit("site_status_change", data);
    });

    this.socket.on("new_incident", (data) => {
      this.emit("new_incident", data);
    });

    this.socket.on("incident_resolved", (data) => {
      this.emit("incident_resolved", data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // S'abonner aux mises à jour de monitoring
  subscribeToMonitoring() {
    if (this.socket) {
      this.socket.emit("subscribe_monitoring");
    }
  }

  // Se désabonner des mises à jour
  unsubscribeFromMonitoring() {
    if (this.socket) {
      this.socket.emit("unsubscribe_monitoring");
    }
  }

  // Système d'événements simple
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Erreur dans callback WebSocket:", error);
        }
      });
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket ? this.socket.id : null,
    };
  }
}

// Instance singleton
const wsService = new WebSocketService();

export default wsService;
