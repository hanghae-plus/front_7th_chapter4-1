import { BASE_URL } from "./constants.js";
import { registerAllEvents } from "./events";
import { initRender } from "./render";
import { router } from "./router";
import { loadCartFromStorage } from "./services";
import { PRODUCT_ACTIONS, productStore } from "./stores";
import { registerGlobalEvents } from "./utils";

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
  // 서버 데이터 복원
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;
    if (data.products) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: data.products,
          categories: data.categories,
          totalCount: data.totalCount,
          loading: false,
          error: null,
          status: "done",
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
    delete window.__INITIAL_DATA__;
  }

  // 클라이언트 렌더링 시작
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
