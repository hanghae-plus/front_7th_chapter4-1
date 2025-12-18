import { ProductList, SearchBar } from "../components";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { productStore } from "../stores";
import { isServer } from "../utils/isServer.js";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      const state = productStore.getState();
      if (state.products.length === 0 || state.loading) {
        loadProductsAndCategories();
      }
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  () => {
    const productState = isServer() && global.__SSR_DATA__ ? global.__SSR_DATA__ : productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = router.query;
    const { products, loading, error, totalCount, categories } = productState;
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
    });
  },
);
