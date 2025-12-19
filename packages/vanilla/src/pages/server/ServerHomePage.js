import { ProductList, SearchBar } from "../../components/index.js";
import { ServerPageWrapper } from "./ServerPageWrapper.js";

/**
 * 서버용 HomePage 렌더링
 * @param {Object} stores - { productStore, cartStore, uiStore }
 * @param {Object} query - URL 쿼리 파라미터
 * @returns {string} - 렌더링된 HTML
 */
export function renderHomePage(stores, query) {
  const productState = stores.productStore.getState();
  const { search: searchQuery = "", limit = "20", sort = "", category1 = "", category2 = "" } = query;
  const { products, loading, error, totalCount, categories } = productState;
  const category = { category1, category2 };
  const hasMore = products.length < totalCount;

  return ServerPageWrapper(
    {
      headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: `
        ${SearchBar({ searchQuery, limit, sort, category, categories })}

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
    },
    stores,
  );
}
