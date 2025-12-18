import { fetchProducts, fetchProduct, fetchCategories } from "../mock/dataService";
import type { StringRecord } from "../../types";

/**
 * SSR 환경용 Product API
 * Mock 데이터 서비스를 직접 호출합니다.
 */

/**
 * SSR 환경에서 상품 목록 가져오기
 */
export async function getProducts(params: StringRecord = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 직접 mock 데이터 서비스 호출
  return fetchProducts({
    page: Number(page),
    limit: Number(limit),
    search: String(search),
    category1: String(category1),
    category2: String(category2),
    sort: String(sort),
  });
}

/**
 * SSR 환경에서 상품 상세 정보 가져오기
 */
export async function getProduct(productId: string) {
  return fetchProduct(productId);
}

/**
 * SSR 환경에서 카테고리 목록 가져오기
 */
export async function getCategories() {
  return fetchCategories();
}
