import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router } from "../router";
import { withLifecycle } from "../router/withLifecycle.js";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";
import { hydrateStoreFromSSR, hasHomePageData, hasCategoryData } from "../utils/hydration.js";

export const HomePage = withLifecycle(
  {
    ssr: async (params) => {
      const ctx = params?.params?.ctx;
      await loadProductsAndCategories(params?.query, ctx);
      const data = (ctx?.store || productStore).getState();
      return {
        products: data.products,
        categories: data.categories,
        totalCount: data.totalCount,
      };
    },
    metadata: async () => {
      return {
        title: "쇼핑몰 - 홈",
      };
    },
    onMount: () => {
      const hydrated = hydrateStoreFromSSR();

      if (hydrated && hasHomePageData() && hasCategoryData()) {
        return;
      }

      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query || {};
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  (params, props) => {
    const source = props?.data || productStore.getState();
    const { products, loading, error, totalCount, categories } = source;
    const {
      search: searchQuery,
      limit,
      sort,
      category1,
      category2,
    } = props?.data ? params?.query || {} : router.query || {};
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
