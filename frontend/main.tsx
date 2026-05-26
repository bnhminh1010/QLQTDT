import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./src/store";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <ReduxProvider store={store}>
      <App />
    </ReduxProvider>
  </HashRouter>,
);
