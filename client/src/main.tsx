import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";
import "./i18n"; // Инициализация i18n

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <App />
  </ThemeProvider>
);
