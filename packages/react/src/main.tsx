declare global {
  interface Window {
    __INITIAL_DATA__?: Record<string, unknown>;
  }
}

import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { createRoot } from "react-dom/client";
import { isServer } from "./utils/ssrUtils.ts";
import { PRODUCT_ACTIONS, productStore } from "./entities/index.ts";
import { createRouter } from "./router/router.ts";
import { RouterContext } from "./router/hooks/useRouterContext.ts";
import { ProductDetailPage } from "./pages/ProductDetailPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";

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
  const router = createRouter({
    "/": HomePage,
    "/product/:id/": ProductDetailPage,
    ".*": NotFoundPage,
  });
  router.start();

  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(
    <RouterContext value={router}>
      <App />
    </RouterContext>,
  );
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}

function restoreServerData() {
  if (isServer()) {
    return;
  }

  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    if (data.products) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: data });
    }

    if (data.currentProduct) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, payload: data.currentProduct });
    }

    delete window.__INITIAL_DATA__;
  }
}

restoreServerData();
