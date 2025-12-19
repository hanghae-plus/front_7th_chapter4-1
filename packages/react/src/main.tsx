import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";

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
  // router가 null이 아닐 때만 start (CSR 전용)
  if (router) {
    router.start();
  }

  const rootElement = document.getElementById("root")!;

  // SSR 콘텐츠 감지
  // 1. window.__INITIAL_DATA__가 있으면 SSR에서 프리페치된 데이터가 있음
  // 2. rootElement에 실제 콘텐츠가 있으면 서버에서 렌더링된 HTML이 있음
  //    (<!--app-html--> 같은 주석은 제외)
  const hasSSRData = typeof window !== "undefined" && window.__INITIAL_DATA__ !== undefined;
  const serverContent = rootElement.innerHTML.trim();
  // 주석만 있거나 비어있으면 서버 콘텐츠 아님
  const hasServerContent = serverContent.length > 0 && !serverContent.startsWith("<!--");

  if (hasSSRData || hasServerContent) {
    // SSR/SSG: Hydration - 서버에서 렌더링된 HTML에 이벤트 핸들러 연결
    hydrateRoot(rootElement, <App />);
  } else {
    // CSR: 새로 렌더링
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
