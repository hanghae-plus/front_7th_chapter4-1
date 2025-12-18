import { getProducts, getCategories } from "../api/server/productApi";
import type { StringRecord } from "../types";

/**
 * 홈페이지 데이터 로더
 * SSR과 SSG에서 재사용 가능
 */
export async function homeLoader(query: StringRecord = {}) {
  const { page = 1, current = 1, limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = query;

  // page와 current 중 하나만 사용 (current 우선)
  const actualPage = current || page;

  try {
    // 병렬로 데이터 패칭
    const [productsResponse, categories] = await Promise.all([
      getProducts({
        page: actualPage,
        limit,
        search,
        category1,
        category2,
        sort,
      }),
      getCategories(),
    ]);

    return {
      products: productsResponse.products,
      categories,
      totalCount: productsResponse.pagination.total,
      pagination: productsResponse.pagination,
      filters: productsResponse.filters,
    };
  } catch (error) {
    console.error("홈페이지 데이터 로드 실패:", error);
    throw error;
  }
}
