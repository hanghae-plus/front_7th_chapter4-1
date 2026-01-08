import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore, PRODUCT_ACTIONS } from "./stores";

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
 * 서버에서 주입한 초기 데이터로 스토어 복원 (Hydration)
 */
function restoreInitialData() {
  const initialData = window.__INITIAL_DATA__;

  if (initialData) {
    // productStore에 서버에서 렌더링한 초기 데이터 복원
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products || [],
        totalCount: initialData.totalCount || 0,
        categories: initialData.categories || {},
        currentProduct: initialData.currentProduct || null,
        relatedProducts: initialData.relatedProducts || [],
        loading: false,
        status: "done",
      },
    });

    // 초기 데이터 사용 후 메모리에서 삭제 (보안 및 메모리 절약)
    delete window.__INITIAL_DATA__;
  }
}

function main() {
  // Hydration: 서버에서 주입한 초기 데이터 복원
  restoreInitialData();

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
