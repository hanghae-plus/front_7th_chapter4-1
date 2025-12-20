import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { registerRoutes, router } from "./router";
import { BASE_URL } from "./constants.js";
import { routes } from "./router/routes.js";
import { productStore, PRODUCT_ACTIONS } from "./stores";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

// 라우트 등록 (MSW 전에 해도 됨)
registerRoutes(router, routes);

function main() {
  // SSR에서 전달된 초기 데이터로 store 초기화 (hydration)
  const initialData = window.__INITIAL_DATA__;
  if (initialData) {
    productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: initialData });
    window.__INITIAL_DATA__ = undefined;
  }

  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();

  // initRender 후에 router.start() 호출 (render가 구독된 후)
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
