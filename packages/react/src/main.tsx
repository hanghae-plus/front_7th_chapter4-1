import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./entities/products/productStore";

// 타입 정의
declare global {
  interface Window {
    __INITIAL_DATA__?: {
      productStore?: typeof initialProductState;
    };
  }
}

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
 * 서버에서 받은 초기 데이터로 store를 hydration
 */
function hydrateStore() {
  // window.__INITIAL_DATA__가 있으면 서버에서 렌더링된 페이지
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialData = (window as { __INITIAL_DATA__?: { productStore?: typeof initialProductState } })
      .__INITIAL_DATA__;
    if (initialData) {
      const { productStore: productStoreData } = initialData;

      if (productStoreData) {
        // 서버에서 받은 데이터로 productStore 초기화
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: productStoreData,
        });
      }

      // 초기 데이터 사용 후 삭제 (메모리 절약)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as { __INITIAL_DATA__?: unknown }).__INITIAL_DATA__;
    }
  }
}

function main() {
  // SSR hydration: 서버에서 받은 초기 데이터로 store 초기화
  hydrateStore();

  router.start();

  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
