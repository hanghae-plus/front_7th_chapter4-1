import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { productStore } from "./stores";
import { PRODUCT_ACTIONS } from "./stores";
import { BASE_URL } from "./constants.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

/**
 * 서버에서 전달된 초기 상태로 클라이언트 상태 복원 (Hydration)
 */
function hydrateFromServer() {
  // 서버 데이터 복원
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    if (data.products) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: data,
      });
    }

    if (data.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
      if (data.relatedProducts) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: data.relatedProducts,
        });
      }
    }

    delete window.__INITIAL_DATA__;
  }
}

function main() {
  // 서버 상태 복원 (hydration)
  hydrateFromServer();

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
