import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/lilita-one/latin-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "./design-entry.css";
import App from "./App.tsx";

// Restore accessibility preferences on every page load
const html = document.documentElement;
if (localStorage.getItem("a11y-contrast") === "1")
  html.classList.add("a11y-contrast");
if (localStorage.getItem("a11y-large-text") === "1")
  html.classList.add("a11y-large-text");
if (localStorage.getItem("a11y-keyboard-hints") !== "0")
  html.classList.add("a11y-keyboard-hints");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
