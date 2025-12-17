import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { hydrateRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";
import { cartStore, CART_ACTIONS } from "./entities/carts/cartStore";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  // 1. SSR 상태 복원 (window.__INITIAL_DATA__에서)
  const initialData = window.__INITIAL_DATA__;

  if (initialData) {
    // Product store 복원
    if (initialData.product) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: initialData.product,
      });
    }

    // Cart store 복원
    if (initialData.cart) {
      cartStore.dispatch({
        type: CART_ACTIONS.LOAD_FROM_STORAGE,
        payload: initialData.cart,
      });
    }
  }

  // 2. 클라이언트 라우터 시작
  router.start();

  // 3. Hydration (SSR HTML을 인터랙티브하게 만듦)
  const rootElement = document.getElementById("root")!;
  hydrateRoot(rootElement, <App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
