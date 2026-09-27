import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import PwaUpdatePrompt from "./components/PwaUpdatePrompt.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";

createRoot(
  document.getElementById("root"),
).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <App />
          <PwaUpdatePrompt />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);