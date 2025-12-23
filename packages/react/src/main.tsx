import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { hydrateRoot } from "react-dom/client";
import { pageConfigs } from "./pages/page-configs.ts";

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

  const currentRoute = router.route;
  const pageConfig = pageConfigs[currentRoute?.path ?? ""];
  if (pageConfig && window.__INITIAL_DATA__) {
    pageConfig.initializeStoreFromSSR?.(window.__INITIAL_DATA__);
  }

  const rootElement = document.getElementById("root")!;
  hydrateRoot(rootElement, <App />);
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
