import { cartStore, productStore, uiStore } from "./stores";
import { router } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { withBatch } from "./utils";

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

/**
 * 페이지별 title 업데이트
 */
const updatePageTitle = () => {
  const PageComponent = router.target;

  if (PageComponent === HomePage) {
    document.title = "쇼핑몰 - 홈";
  } else if (PageComponent === ProductDetailPage) {
    const product = productStore.getState().currentProduct;
    if (product) {
      document.title = `${product.title} - 쇼핑몰`;
    }
  } else {
    document.title = "쇼핑몰";
  }
};

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const PageComponent = router.target;

  // title 업데이트
  updatePageTitle();

  // App 컴포넌트 렌더링
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
