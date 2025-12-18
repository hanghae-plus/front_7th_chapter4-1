import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { hydrateFromServerData } from "./hydration";
import { createRoot } from "react-dom/client";

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
  // 서버에서 전달된 데이터로 상태 복원
  hydrateFromServerData();

  router.start();

  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
