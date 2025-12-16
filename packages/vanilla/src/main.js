import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
// TODO: Hydration에 필요한 import 추가
// - productStore: 스토어에 데이터를 설정하기 위해 필요
// - PRODUCT_ACTIONS: SETUP 액션 타입

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

/**
 * Hydration: 서버에서 전달받은 초기 데이터를 클라이언트 스토어에 복원
 *
 * 왜 필요한가?
 * - SSR에서 서버가 이미 API를 호출하여 데이터를 가져옴
 * - 이 데이터가 window.__INITIAL_DATA__에 저장되어 HTML과 함께 전송됨
 * - 클라이언트에서 같은 데이터를 다시 fetch하면 불필요한 중복 요청
 * - 따라서 __INITIAL_DATA__가 있으면 이를 스토어에 바로 설정
 *
 * 흐름:
 * 서버 렌더링 → __INITIAL_DATA__ 주입 → 클라이언트 로드 → Hydration → 인터랙티브
 */
function hydrateFromServer() {
  // TODO: 서버 데이터 복원 구현
  // 1. window.__INITIAL_DATA__ 존재 여부 확인
  if (window.__INITIAL_DATA__) {
    // 2. 존재하면 productStore.dispatch로 SETUP 액션 디스패치
    //    - payload로 __INITIAL_DATA__ 전달
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: window.__INITIAL_DATA__,
    });
    // 3. delete window.__INITIAL_DATA__로 메모리 정리
    delete window.__INITIAL_DATA__;
  }
  //
  // 힌트: main-server.js에서 어떤 데이터를 initialData로 반환하는지 확인해보세요
  // 힌트: productStore.js의 SETUP 액션이 어떻게 동작하는지 확인해보세요
}

function main() {
  // Hydration 먼저 실행 (API 호출 전에 데이터 복원)
  hydrateFromServer();

  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
