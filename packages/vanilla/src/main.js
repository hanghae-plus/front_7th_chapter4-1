import { registerGlobalEvents } from "./utils";
import { initRender, render } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { productStore, cartStore, uiStore } from "./stores";
import { BASE_URL } from "./constants.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  // Hydration: 서버 렌더링 HTML이 있으면
  if (window.__INITIAL_DATA__) {
    console.log("Hydrating from server state");

    // 1. Store 상태 복원
    if (window.__INITIAL_DATA__.product) {
      productStore.dispatch({
        type: "SETUP",
        payload: window.__INITIAL_DATA__.product,
      });
    }

    if (window.__INITIAL_DATA__.cart) {
      cartStore.dispatch({
        type: "LOAD_FROM_STORAGE",
        payload: window.__INITIAL_DATA__.cart,
      });
    }

    // 2. 이벤트만 등록 (재렌더링 안함)
    registerAllEvents();
    registerGlobalEvents();

    // 3. Router hydrate (히스토리만 초기화, notify 안함)
    router.hydrate();

    // 4. 이후 변경사항만 감지하도록 subscribe
    productStore.subscribe(render);
    cartStore.subscribe(render);
    uiStore.subscribe(render);
    router.subscribe(render);
  } else {
    // CSR 폴백 (서버 렌더링 없을 때)
    console.log("Client-side rendering");
    registerAllEvents();
    registerGlobalEvents();
    loadCartFromStorage();
    initRender();
    router.start();
  }
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
