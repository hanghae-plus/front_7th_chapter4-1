import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { pageConfigs } from "./pages/page-configs.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function hydrateFromSSR(router) {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;
    const route = router.route;
    const pageConfig = pageConfigs[route.path];
    if (pageConfig) {
      pageConfig.hydrate(data);
    }

    delete window.__INITIAL_DATA__;
  }
}

function main() {
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
  hydrateFromSSR(router);
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
