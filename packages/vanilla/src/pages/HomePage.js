import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router as clientRouter, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      const { products, categories, status } = productStore.getState();

      // 데이터가 이미 있고 로딩 완료면 스킵
      if (products.length > 0 && Object.keys(categories).length > 0 && status === "done") {
        return;
      }
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = clientRouter.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  (serverProps) => {
    const { serverRouter, ...serverData } = serverProps ?? {};
    const productState = serverProps ? serverData : productStore.getState();
    const router = serverProps ? serverRouter : clientRouter;

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
