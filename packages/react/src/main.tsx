import { App } from "./App";
import { createRouter, initRoutes } from "./router";
import { BASE_URL } from "./constants";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Providers } from "./apps";
import { createStores, getInitStates } from "./entities";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

const router = createRouter();
const stores = createStores(getInitStates(window.__INITIAL_DATA__));
initRoutes(router);
router.start();
router.query = { current: undefined };

function main() {
  const rootElement = document.getElementById("root")!;

  const app = (
    <Providers {...stores} router={router}>
      <App />
    </Providers>
  );

  if (rootElement.innerHTML.trim() !== "<!--app-html-->") {
    // 서버 렌더링된 HTML에 이벤트 리스너 등을 연결
    hydrateRoot(rootElement, app);
  } else {
    // 클라이언트에서 처음부터 렌더링
    createRoot(rootElement).render(app);
  }
}

enableMocking().then(main);
