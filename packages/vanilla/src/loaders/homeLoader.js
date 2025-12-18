import { getProducts, getCategories } from "../api/server/productApi.js";

/**
 * 홈페이지 데이터 로더
 * SSR과 SSG에서 재사용 가능
 *
 * @param {Object} query - URL 쿼리 파라미터
 * @param {number} [query.page=1] - 페이지 번호
 * @param {number} [query.limit=20] - 페이지당 상품 수
 * @param {string} [query.search=''] - 검색어
 * @param {string} [query.category1=''] - 1차 카테고리
 * @param {string} [query.category2=''] - 2차 카테고리
 * @param {string} [query.sort='price_asc'] - 정렬 기준
 * @returns {Promise<Object>} 홈페이지 렌더링에 필요한 모든 데이터
 */
export async function homeLoader(query = {}) {
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
