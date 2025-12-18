import { ProductList, SearchBar } from "../components";
import { productStore as clientProductStore } from "../stores";
import { router as clientRouter, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

// 서버 환경 감지 및 context 가져오기
const getContext = () => {
  if (typeof global !== "undefined" && global.serverContext) {
    return global.serverContext;
  }
  return { productStore: clientProductStore, router: clientRouter };
};

export const HomePage = withLifecycle(
  {
    onMount: () => {
      // 서버 환경에서는 실행하지 않음
      if (typeof window !== "undefined") {
        loadProductsAndCategories();
      }
    },
    watches: [
      () => {
        if (typeof window === "undefined") return [];
        const { search, limit, sort, category1, category2 } = clientRouter.query;
        return [search, limit, sort, category1, category2];
      },
      () => {
        if (typeof window !== "undefined") {
          loadProducts(true);
        }
      },
    ],
  },
  () => {
    const { productStore, router } = getContext();
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
