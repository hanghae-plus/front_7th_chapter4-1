import { registerGlobalEvents } from "./utils";
import { initRender, render } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { isServer } from "./utils/ssrUtils.js";

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

function restoreServerData() {
  if (isServer()) {
    return;
  }

  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    if (data.products) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: data });
    }

    if (data.currentProduct) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, payload: data.currentProduct });
    }

    delete window.__INITIAL_DATA__;

    render();
  }
}

restoreServerData();
