import { App } from "./App";
import { ClientRouter, RouterProvider } from "./router";
import { initRoutes } from "./routes";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import type { FunctionComponent } from "react";
import { InitialDataProvider, type PageData } from "./contexts/InitialDataContext.tsx";
import { PRODUCT_ACTIONS, productStore } from "./entities/index.ts";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

const hydrateData = () => {
  const data = window?.__INITIAL_DATA__ as PageData;
  if (data) {
    if ("products" in data) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_PRODUCTS,
        payload: {
          products: data.products,
          totalCount: data.totalCount,
        },
      });
    }
    if ("categories" in data) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CATEGORIES,
        payload: data.categories,
      });
    }
    if ("currentProduct" in data) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
    }
    if ("relatedProducts" in data) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }
    delete window.__INITIAL_DATA__;
  }
};

function main() {
  const router = new ClientRouter<FunctionComponent>(BASE_URL);
  initRoutes(router);
  router.start();
  hydrateData();

  const rootElement = document.getElementById("root")!;
  if (rootElement.innerHTML === "<!--app-html-->") {
    createRoot(rootElement).render(
      <InitialDataProvider value={window.__INITIAL_DATA__}>
        <RouterProvider router={router}>
          <App />
        </RouterProvider>
      </InitialDataProvider>,
    );
  } else {
    hydrateRoot(
      rootElement,
      <RouterProvider router={router}>
        <App />
      </RouterProvider>,
    );
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
