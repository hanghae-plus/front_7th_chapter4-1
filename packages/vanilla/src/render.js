import { cartStore, productStore, uiStore } from "./stores";
import { router } from "./router";
import { NotFoundPage } from "./pages";
import { withBatch } from "./utils";

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const route = router.route;
  if (!route) {
    rootElement.innerHTML = NotFoundPage();
    return;
  }

  // handler.component로 접근
  const PageComponent = route.handler.component;

  // store에서 데이터 가져옴 (hydration 시 main.js에서 초기화됨)
  rootElement.innerHTML = PageComponent();
});

/**
 * 렌더링 초기화 - Store 변화 감지 설정
 */
export function initRender() {
  // 각 Store의 변화를 감지하여 자동 렌더링
  productStore.subscribe(render);
  cartStore.subscribe(render);
  uiStore.subscribe(render);
  router.subscribe(render);
}
