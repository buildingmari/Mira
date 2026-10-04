
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import "./styles/mira-dark.css";
  import { initPwa } from "./app/lib/pwa";

  // Before React: Chrome fires beforeinstallprompt once, early.
  initPwa();

  createRoot(document.getElementById("root")!).render(<App />);
  