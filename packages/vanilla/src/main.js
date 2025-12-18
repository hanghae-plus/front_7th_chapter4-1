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
  // 서버에서 전달받은 초기 데이터 복원
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    // 상품 목록 데이터 복원
    if (data.products || data.totalCount || data.categories) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: data,
      });
    }

    // 상품 상세 데이터 복원
    if (data.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
    }

    // 초기 데이터 정리
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
