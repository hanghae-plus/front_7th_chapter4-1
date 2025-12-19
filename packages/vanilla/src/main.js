import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { BASE_URL } from "./constants.js";
import { initRoutes } from "./routes";
import { router } from "./router";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

const hydrateData = () => {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;
    if (data.products) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_PRODUCTS,
        payload: {
          products: data.products,
          totalCount: data.pagination.total,
        },
      });
    }
    if (data.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
    }
    if (data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }
    if (data.categories) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CATEGORIES,
        payload: data.categories,
      });
    }
    delete window.__INITIAL_DATA__;
  }
};

function main() {
  hydrateData();
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  initRoutes();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
