import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore, uiStore, PRODUCT_ACTIONS, UI_ACTIONS } from "./stores";

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
 * 서버에서 전달된 초기 데이터로 스토어 복원 (Hydration)
 */
function hydrateStores() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const { productStore: productState, uiStore: uiState } = window.__INITIAL_DATA__;

    // Product Store 복원
    if (productState) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: productState,
      });
    }

    // Cart Store 복원 (서버에서는 빈 상태이므로 클라이언트에서 로컬스토리지에서 로드)
    // loadCartFromStorage()가 나중에 호출되므로 여기서는 복원하지 않음

    // UI Store 복원
    if (uiState) {
      if (!uiState.cartModal?.isOpen) {
        uiStore.dispatch({ type: UI_ACTIONS.CLOSE_CART_MODAL });
      }
      if (!uiState.toast?.isVisible) {
        uiStore.dispatch({ type: UI_ACTIONS.HIDE_TOAST });
      }
    }

    // 초기 데이터 삭제 (메모리 정리)
    delete window.__INITIAL_DATA__;
  }
}

function main() {
  // 서버에서 전달된 초기 데이터로 스토어 복원 (Hydration)
  hydrateStores();

  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage(); // 장바구니는 로컬스토리지에서 로드
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
