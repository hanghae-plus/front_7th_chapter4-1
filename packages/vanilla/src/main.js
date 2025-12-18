import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores";
import { PRODUCT_ACTIONS } from "./stores/actionTypes";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    // store sync
    if (data.products) productStore.dispatch(PRODUCT_ACTIONS.SETUP, data);
    if (data.currentProduct) productStore.dispatch(PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, data);

    delete window.__INITIAL_DATA__;
  }

  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
