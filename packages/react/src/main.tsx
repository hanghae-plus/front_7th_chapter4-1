import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";

// SSR 감지를 Store 로드 전에 먼저 수행 (window.__INITIAL_DATA__가 Store에서 삭제되기 전)
const rootElement = document.getElementById("root")!;
const serverContent = rootElement.innerHTML.trim();
// 주석만 있거나 비어있으면 서버 콘텐츠 아님
const hasServerContent = serverContent.length > 0 && !serverContent.startsWith("<!--");
const hasSSRData = typeof window !== "undefined" && window.__INITIAL_DATA__ !== undefined;
const shouldHydrate = hasSSRData || hasServerContent;

console.log("[main:init] SSR 감지:", { hasSSRData, hasServerContent, shouldHydrate });

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

async function main() {
  // App과 router를 동적으로 import (SSR 감지 후에 Store가 로드되도록)
  const [{ App }, { router }] = await Promise.all([import("./App"), import("./router")]);

  // router가 null이 아닐 때만 start (CSR 전용)
  if (router) {
    router.start();
  }

  console.log("[main] shouldHydrate:", shouldHydrate);

  if (shouldHydrate) {
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
