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

// 초기 데이터로 store 복원
function hydrateStore() {
  const initialData = window.__INITIAL_DATA__;
  if (!initialData) return;

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
}

function main() {
  router.start();

  // SSR 초기 데이터로 store 복원
  hydrateStore();

  const rootElement = document.getElementById("root")!;

  // SSR로 렌더링된 HTML이 있으면 hydrate, 아니면 render
  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, <App />);
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
