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
  router.start();

  const rootElement = document.getElementById("root")!;

  // SSR 여부 확인: rootElement에 이미 HTML이 있으면 SSR
  const isSSR = rootElement.innerHTML.trim().length > 0;

  if (isSSR) {
    // SSR: hydrateRoot 사용
    console.log("Hydrating SSR content...");
    hydrateRoot(rootElement, <App />);
  } else {
    // CSR: createRoot 사용
    console.log("Rendering CSR content...");
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
