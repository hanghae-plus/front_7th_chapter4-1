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
    const { productStore: productState, uiStore: uiState, _checksum: serverChecksum } = window.__INITIAL_DATA__;

    // Product Store 복원
    if (productState) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          ...productState,
          // 서버에서 이미 로드된 상태이므로 loading을 false로 설정
          loading: false,
        },
      });

      // 서버-클라이언트 데이터 일치 확인
      if (serverChecksum) {
        const clientChecksum = JSON.stringify({
          products: productState.products?.length || 0,
          currentProduct: productState.currentProduct?.productId || null,
          categories: Object.keys(productState.categories || {}).length,
        }).replace(/\s/g, "");

        if (serverChecksum !== clientChecksum) {
          console.warn(
            "[Hydration] 서버-클라이언트 데이터 불일치 감지. 서버 체크섬:",
            serverChecksum,
            "클라이언트 체크섬:",
            clientChecksum,
          );
        } else if (import.meta.env.DEV) {
          console.log("[Hydration] 서버-클라이언트 데이터 일치 확인 완료");
        }
      }
    }

    // Cart Store 복원
    // 서버에서는 빈 상태이지만, 클라이언트에서 로컬스토리지에서 로드하므로
    // 서버 상태는 무시하고 loadCartFromStorage()에서 처리

    // UI Store 복원
    if (uiState) {
      // 전체 UI 상태를 복원
      // cartModal 상태 복원
      if (uiState.cartModal) {
        if (uiState.cartModal.isOpen) {
          // 서버에서는 모달이 열려있지 않으므로 복원할 필요 없음
        } else {
          uiStore.dispatch({ type: UI_ACTIONS.CLOSE_CART_MODAL });
        }
      }

      // globalLoading 상태는 클라이언트에서 관리하므로 복원하지 않음

      // toast 상태 복원
      if (uiState.toast) {
        if (uiState.toast.isVisible) {
          uiStore.dispatch({
            type: UI_ACTIONS.SHOW_TOAST,
            payload: {
              message: uiState.toast.message,
              type: uiState.toast.type || "info",
            },
          });
        } else {
          uiStore.dispatch({ type: UI_ACTIONS.HIDE_TOAST });
        }
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
