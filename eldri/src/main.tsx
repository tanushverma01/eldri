import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Widget from "./Widget.tsx";
import "./index.css"; // Your Tailwind CSS

// A very simple router
const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {path === "/widget" ? <Widget /> : <App />}
  </React.StrictMode>
);