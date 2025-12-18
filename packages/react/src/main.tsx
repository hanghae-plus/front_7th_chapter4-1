import { Router } from "@hanghae-plus/lib";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { routes } from "./router/routes.ts";
import { BASE_URL } from "./constants.ts";
import { createProductStore } from "./entities/index.ts";
import { ProductProvider } from "./entities/products/context/ProductContext.tsx";
import { hasInitialData } from "./utils/hydration.ts";
import { RouterProvider } from "./router/RouterContext.tsx";

/**
 * MSW 브라우저 모킹 활성화
 * 테스트 환경이 아닐 때만 API 모킹을 시작함
 */
const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass", // 모킹하지 않은 요청은 그대로 통과
    }),
  );

/**
 * 애플리케이션 초기화 및 렌더링 함수
 *
 * SSR 데이터가 있으면 하이드레이션, 없으면 일반 렌더링 수행
 */
function main() {
  // 라우터 생성 및 초기화
  const router = new Router(routes, BASE_URL);
  router.start();

  // 서버에서 주입한 초기 데이터 가져오기
  const initData = window.__INITIAL_DATA__;

  /**
   * 애플리케이션 컴포넌트 렌더링 함수
   * RouterProvider와 ProductProvider로 감싸서 컨텍스트 제공
   */
  const renderApp = () => {
    return (
      <RouterProvider router={router}>
        <ProductProvider productStore={createProductStore(initData || {})}>
          <App />
        </ProductProvider>
      </RouterProvider>
    );
  };

  const rootElement = document.getElementById("root")!;

  // SSR 데이터 존재 여부 확인
  const hasSSRData = hasInitialData();
  const hasServerContent = rootElement.innerHTML.trim() !== "";

  // SSR 데이터가 있거나 서버에서 렌더링된 콘텐츠가 있으면 하이드레이션
  if (hasSSRData || hasServerContent) {
    hydrateRoot(rootElement, renderApp());
  } else {
    // 일반 클라이언트 사이드 렌더링
    createRoot(rootElement).render(renderApp());
  }
}

// 애플리케이션 시작
// 테스트 환경이 아닐 때는 MSW 모킹을 활성화한 후 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
