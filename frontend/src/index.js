import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL || ""}/service-worker.js`, {
        scope: `${process.env.PUBLIC_URL || "/"}/`,
      })
      .catch((error) => console.error("Service worker registration failed:", error));
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
