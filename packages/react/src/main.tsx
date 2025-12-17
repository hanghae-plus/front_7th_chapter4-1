import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

/**
 * 서버에서 전달된 초기 상태를 클라이언트 스토어에 복원 (Hydration)
 */
function hydrateStores() {
  // window.__INITIAL_DATA__에서 서버 상태 읽기
  const initialState = window.__INITIAL_DATA__ || {};

  if (typeof window.__INITIAL_DATA__ === "undefined" || !initialState.productStore) {
    return;
  }

  // productStore 상태 복원
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: initialState.productStore,
  });
}

function main() {
  // 1. 서버에서 전달된 초기 상태 복원 (Hydration)
  hydrateStores();

  // 2. 라우터 시작
  router.start();

  // 3. React 앱 렌더링 (Hydration)
  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
