import { cartStore, productStore, uiStore } from "./stores";
import { router } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { withBatch } from "./utils";

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

/**
 * 페이지 title 업데이트
 * 라우트 변경 시 페이지 컴포넌트의 metadata 함수를 호출하여 title을 업데이트
 */
const updateTitle = async () => {
  try {
    const pageComponent = router.target;
    if (pageComponent?.metadata) {
      const params = {
        pathname: window.location.pathname,
        query: router.query || {},
        params: router.params || {},
      };
      const metadata = await pageComponent.metadata(params);
      if (metadata?.title) {
        document.title = metadata.title;
      }
    }
  } catch (error) {
    console.error("Failed to update title:", error);
  }
};

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const PageComponent = router.target;

  // App 컴포넌트 렌더링
  rootElement.innerHTML = PageComponent();

  // 페이지 title 업데이트 (비동기이므로 즉시 실행)
  updateTitle().catch((error) => {
    console.error("Failed to update title:", error);
  });
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
