import { productStore } from "../stores";
import { loadProductDetailForPage } from "../services";
import { router, withLifecycle } from "../router";
import { renderProductDetailPageView } from "../views/pages.js";

/**
 * 상품 상세 페이지 컴포넌트
 */
export const ProductDetailPage = withLifecycle(
  {
    onMount: () => {
      loadProductDetailForPage(router.params.id);
    },
    watches: [() => [router.params.id], () => loadProductDetailForPage(router.params.id)],
  },
  () => {
    const { currentProduct: product, relatedProducts = [], error, loading } = productStore.getState();

    return renderProductDetailPageView({
      productState: { currentProduct: product, relatedProducts, error, loading },
    });
  },
);
