import { router } from "../router/router.js";
import { productStore } from "../stores/index.js";

/**
 * 라우트 정보와 상품 데이터를 기반으로 title 문자열 생성
 * @param {Object} routeInfo - 라우트 정보 (path 포함)
 * @param {Object} product - 상품 정보 (optional)
 * @returns {string} title 문자열
 */
export function generateTitle(routeInfo, product = null) {
  if (!routeInfo) {
    return "쇼핑몰";
  }

  if (routeInfo.path === "/product/:id/") {
    if (product?.title) {
      return `${product.title} - 쇼핑몰`;
    }
    return "상품 상세 - 쇼핑몰";
  } else if (routeInfo.path === "/") {
    return "쇼핑몰 - 홈";
  } else {
    return "404 - 쇼핑몰";
  }
}

/**
 * 현재 라우트에 따라 document.title 업데이트
 */
export function updateTitle() {
  if (typeof window === "undefined") return;

  const routeInfo = router.route;
  let product = null;

  if (routeInfo?.path === "/product/:id/") {
    const state = productStore.getState();
    product = state.currentProduct;
  }

  document.title = generateTitle(routeInfo, product);
}
