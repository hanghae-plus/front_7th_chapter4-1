import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores";
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

/**
 * 서버에서 받은 초기 데이터로 store를 hydration
 */
function hydrateStores() {
  // window.__INITIAL_DATA__가 있으면 서버에서 렌더링된 페이지
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const { productStore: productStoreData } = window.__INITIAL_DATA__;

    if (productStoreData) {
      // 서버에서 받은 데이터로 productStore 초기화
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: productStoreData,
      });
    }

    // 초기 데이터 사용 후 삭제 (메모리 절약)
    delete window.__INITIAL_DATA__;
  }
}

function main() {
  // SSR hydration: 서버에서 받은 초기 데이터로 store 초기화
  hydrateStores();

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
