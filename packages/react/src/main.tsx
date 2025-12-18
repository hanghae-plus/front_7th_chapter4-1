/**
 * 클라이언트 엔트리 포인트
 *
 * SSR/SSG로 생성된 페이지인 경우:
 * - window.__INITIAL_DATA__가 존재
 * - hydrateRoot()로 기존 HTML에 React 연결
 *
 * CSR 페이지인 경우:
 * - window.__INITIAL_DATA__가 없음
 * - createRoot()로 새로 렌더링
 */
import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrateFromServerData } from "./hydration";

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
  router.start();

  const rootElement = document.getElementById("root")!;

  // SSR/SSG 데이터가 있으면 Hydration, 없으면 일반 CSR
  if (window.__INITIAL_DATA__) {
    // 1. 서버에서 프리페칭한 데이터를 스토어에 복원
    hydrateFromServerData();
    // 2. 기존 HTML에 React 이벤트 핸들러 연결
    hydrateRoot(rootElement, <App />);
  } else {
    // 일반 CSR: 빈 DOM에 새로 렌더링
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
