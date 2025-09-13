import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Affichage d'erreur pour le développement
// if (process.env.NODE_ENV === "development") {
//   window.addEventListener("unhandledrejection", (event) => {
//     console.error("Unhandled promise rejection:", event.reason);
//   });

//   window.addEventListener("error", (event) => {
//     console.error("JavaScript error:", event.error);
//   });
// }

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
