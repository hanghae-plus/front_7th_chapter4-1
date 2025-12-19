import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { PRODUCT_ACTIONS, productStore } from "./entities/products/productStore";
import type { Categories, Product } from "./entities/products/types";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { RouterContext } from "./router";

declare global {
  interface Window {
    __INITIAL_DATA__?: {
      products?: Product[];
      categories?: Categories;
      totalCount?: number;
      currentProduct?: Product;
      relatedProducts?: Product[];
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

function main() {
  const router = new Router<FunctionComponent>(BASE_URL);

  // 서버 데이터 복원
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;
    if (data.products) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: data.products,
          categories: data.categories,
          totalCount: data.totalCount,
          loading: false,
          error: null,
          status: "done",
        },
      });
    }
    if (data.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_STATUS,
        payload: "done",
      });
    }
    if (data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }
    delete window.__INITIAL_DATA__;
  }

  // 라우트 등록
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  // 클라이언트 렌더링 시작
  router.start();

  const rootElement = document.getElementById("root")!;
  const app = (
    <RouterContext.Provider value={router}>
      <App />
    </RouterContext.Provider>
  );

  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app);
  } else {
    createRoot(rootElement).render(app);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
