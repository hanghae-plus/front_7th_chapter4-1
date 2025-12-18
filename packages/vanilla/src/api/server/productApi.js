import { fetchProducts, fetchProduct, fetchCategories } from "../mock/dataService.js";

/**
 * SSR 환경용 Product API
 * Mock 데이터 서비스를 직접 호출합니다.
 */

/**
 * SSR 환경에서 상품 목록 가져오기
 */
export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 직접 mock 데이터 서비스 호출
  return fetchProducts({
    page,
    limit,
    search,
    category1,
    category2,
    sort,
  });
}

/**
 * SSR 환경에서 상품 상세 정보 가져오기
 */
export async function getProduct(productId) {
  return fetchProduct(productId);
}

/**
 * SSR 환경에서 카테고리 목록 가져오기
 */
export async function getCategories() {
  return fetchCategories();
}
