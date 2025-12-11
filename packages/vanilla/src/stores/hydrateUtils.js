import { PRODUCT_ACTIONS } from "./actionTypes.js";

export function getInitStates(initData) {
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

export function setupProductState(productStore, initData) {
  const { productState } = getInitStates(initData);
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: productState,
  });
}
