import { registerGlobalEvents } from "./utils/index.js";
import { initRender } from "./render.js";
import { registerAllEvents } from "./events.js";
import { loadCartFromStorage } from "./services/index.js";
import { router } from "./router/index.js";
import { BASE_URL } from "./constants.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { productStore } from "./stores/productStore.js";

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
  // hydration 처리
  if (window.__INITIAL_DATA__) {
    const productState = window.__INITIAL_DATA__;

    // 상품 store 복원 (cartStore는 localStorage에서 로드해줌)
    if (productState) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: productState,
      });
    }
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
