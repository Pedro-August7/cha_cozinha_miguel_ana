import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminPage from "./AdminPage.jsx";
import "./index.css";

const adminRoutes = ["/painel_da_noiva", "/painel-da-noiva"];
const currentPath = window.location.pathname.replace(/\/+$/, "").toLowerCase();
const isAdminRoute = adminRoutes.includes(currentPath);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{isAdminRoute ? <AdminPage /> : <App />}</React.StrictMode>,
);
