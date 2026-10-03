import React from "react";
import ReactDOM from "react-dom/client";
import { useRoute, useScrollTarget } from "./router.jsx";
import Landing from "./Landing.jsx";
import App from "./App.jsx";
import "./base.css";
import "./App.css";

function Shell() {
  const route = useRoute();
  useScrollTarget(window.location.hash, true, route);

  return route === "/app" ? <App /> : <Landing />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>
);
