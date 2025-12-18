import { ProductList, SearchBar } from "../components/index.js";
import { PageWrapper } from "../pages/PageWrapper.js";

export function renderHomePageView({ productState = {}, query = {}, cart, ui }) {
  const { products = [], loading = false, error = null, totalCount = 0, categories = {} } = productState;

  const { search: searchQuery = "", limit = 20, sort = "price_asc", category1 = "", category2 = "" } = query;

  const category = { category1, category2 };
  const hasMore = products.length < totalCount;

  return PageWrapper({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
    children: `
      <!-- 검색 및 필터 -->
      ${SearchBar({ searchQuery, limit, sort, category, categories })}
      
      <!-- 상품 목록 -->
      <div class="mb-6">
        ${ProductList({
          products,
          loading,
          error,
          totalCount,
          hasMore,
        })}
      </div>
    `.trim(),
    cart,
    ui,
  });
}
