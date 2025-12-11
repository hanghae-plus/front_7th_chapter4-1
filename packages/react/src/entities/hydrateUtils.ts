import { createProductStore, PRODUCT_ACTIONS } from "./products";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getInitStates(initData: any) {
  if (!initData) {
    return {};
  }
  const products = initData.products ?? [];
  const categories = initData.categories ?? {};
  const totalCount = initData.totalCount ?? 0;
  const currentProduct = initData.product ?? null;
  const relatedProducts = initData.relatedProducts ?? [];
  const loading = products.length === 0 && relatedProducts.length === 0;

  return {
    productState: {
      // 상품 목록
      products,
      totalCount,

      // 상품 상세
      currentProduct,
      relatedProducts,

      // 로딩 및 에러 상태
      loading,
      error: null,
      status: loading ? "idle" : "done",

      // 카테고리 목록
      categories,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupProductState(productStore: ReturnType<typeof createProductStore>, initData: any) {
  const { productState } = getInitStates(initData);
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: productState,
  });
}
