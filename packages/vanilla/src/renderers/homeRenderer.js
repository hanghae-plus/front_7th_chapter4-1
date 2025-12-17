import { PageWrapper } from "../pages/PageWrapper.js";
import { SearchBar, ProductList } from "../components/index.js";

/**
 * 홈페이지 서버 렌더러
 * @param {Object} data - homeLoader에서 반환된 데이터
 * @returns {Object} { head, html }
 */
export function renderHomePage(data) {
  const { products, categories, filters, pagination } = data;

  const html = PageWrapper({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
    children: `
      <!-- 검색 및 필터 -->
      ${SearchBar({
        searchQuery: filters.search,
        limit: filters.limit || pagination.limit,
        sort: filters.sort,
        category: {
          category1: filters.category1,
          category2: filters.category2,
        },
        categories,
      })}

      <!-- 상품 목록 -->
      <div class="mb-6">
        ${ProductList({
          products,
          loading: false,
          totalCount: pagination.total,
          hasMore: pagination.hasNext,
        })}
      </div>
    `.trim(),
  });

  return {
    head: `<title>쇼핑몰 - 홈</title>`,
    html,
  };
}
