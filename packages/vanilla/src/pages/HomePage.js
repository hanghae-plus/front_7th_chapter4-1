import { ProductList, SearchBar } from "../components";
import { PRODUCT_ACTIONS, productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";
import { getProducts, getCategories } from "../api/productApi.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      if (typeof window === "undefined") {
        return;
      }

      if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
        const data = window.__INITIAL_DATA__;
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            products: data.products,
            categories: data.categories,
            totalCount: data.pagination.total,
            loading: false,
            status: "done",
          },
        });
        window.__INITIAL_DATA__ = undefined;
      } else {
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
    const productState = productStore.getState();
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

Object.assign(HomePage, {
  title: "메인페이지 | 쇼핑몰",
  async getServerSideProps() {
    // router.query를 사용하여 쿼리 파라미터 기반으로 데이터 가져오기
    try {
      const [productsResponse, categories] = await Promise.all([getProducts(router.query), getCategories()]);
      return {
        products: productsResponse.products,
        categories,
        pagination: productsResponse.pagination,
        filters: productsResponse.filters,
      };
    } catch (error) {
      console.error("Failed to load products in SSR:", error);
      // 에러 발생 시 빈 데이터 반환
      return {
        products: [],
        categories: {},
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: {
          search: "",
          category1: "",
          category2: "",
          sort: "price_asc",
        },
      };
    }
  },
});
