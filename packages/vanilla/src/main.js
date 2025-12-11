import { initRender } from "./render";
import { createRouter, initRoutes } from "./router";
import { createStores, getInitStates } from "./stores";
import { BASE_URL } from "./constants";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

const router = createRouter();
router.query = { current: undefined };
const stores = createStores(getInitStates(window.__INITIAL_DATA__));
initRoutes(router);

function main() {
  initRender({ router, stores });
}

enableMocking().then(main);
