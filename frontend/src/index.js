import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations
          .filter((registration) => registration.scope.includes("/DeepTalk/"))
          .forEach((registration) => registration.unregister());
      })
      .catch(() => {});
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
