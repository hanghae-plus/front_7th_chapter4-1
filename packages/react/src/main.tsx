import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrateFromServerData, cleanupInitialData } from "./hydration";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  router.start();

  const rootElement = document.getElementById("root")!;
  const hasServerRenderedContent = rootElement.innerHTML.trim() !== "" && rootElement.innerHTML !== "<!--app-html-->";

  if (hasServerRenderedContent) {
    hydrateFromServerData();
    hydrateRoot(rootElement, <App />);
    cleanupInitialData();
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
