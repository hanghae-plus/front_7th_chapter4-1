import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { cartStore, productStore, uiStore } from "./stores";
import { withBatch } from "./utils";
import { updateTitle } from "./utils/updateTitle.js";

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const PageComponent = router.target;

  // App 컴포넌트 렌더링
  rootElement.innerHTML = PageComponent();

  // 클라이언트 사이드 네비게이션 시 title 업데이트
  updateTitle();
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
