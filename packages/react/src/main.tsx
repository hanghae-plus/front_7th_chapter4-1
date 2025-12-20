import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";

// Window 타입 확장
declare global {
  interface Window {
    __INITIAL_DATA__?: {
      products?: unknown[];
      categories?: unknown;
      totalCount?: number;
      currentProduct?: unknown;
      relatedProducts?: unknown[];
    };
    __MSW_READY__?: boolean;
  }
}

const enableMocking = () =>
  import("./mocks/browser")
    .then(({ worker }) =>
      worker.start({
        serviceWorker: {
          url: `${BASE_URL}mockServiceWorker.js`,
        },
        onUnhandledRequest: "bypass",
      }),
    )
    .then(() => {
      window.__MSW_READY__ = true;
    });

// 초기 데이터로 store 복원
function hydrateStore() {
  const initialData = window.__INITIAL_DATA__;
  if (!initialData) return false;

  // 초기 데이터가 있으면 store에 설정
  if (initialData.products || initialData.currentProduct) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      loading: false,
      status: "done",
    };

    if (initialData.products) payload.products = initialData.products;
    if (initialData.categories) payload.categories = initialData.categories;
    if (initialData.totalCount !== undefined) payload.totalCount = initialData.totalCount;
    if (initialData.currentProduct) payload.currentProduct = initialData.currentProduct;
    if (initialData.relatedProducts) payload.relatedProducts = initialData.relatedProducts;

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload,
    });
  }

  // 사용 후 초기 데이터 삭제
  delete window.__INITIAL_DATA__;
  return true;
}

function main() {
  router.start();

  // SSR 초기 데이터로 store 복원
  const hadSSRData = hydrateStore();

  const rootElement = document.getElementById("root")!;

  // SSR로 렌더링된 HTML이 있으면 hydrate, 아니면 render
  if (rootElement.hasChildNodes() && hadSSRData) {
    hydrateRoot(rootElement, <App />);
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  const hasSSRData = !!window.__INITIAL_DATA__;

  if (hasSSRData) {
    // SSR 모드: hydration 먼저, MSW는 백그라운드로 초기화
    main();
    enableMocking().catch((error) => {
      console.warn("MSW 초기화 실패:", error);
    });
  } else {
    // CSR 모드: MSW 초기화 후 main 실행
    enableMocking()
      .then(main)
      .catch((error) => {
        console.warn("MSW 초기화 실패:", error);
        main();
      });
  }
} else {
  main();
}
