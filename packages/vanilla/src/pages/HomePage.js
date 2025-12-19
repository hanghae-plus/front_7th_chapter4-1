import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { withLifecycle, getQuery, getSSRData, isSSR } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = getQuery();
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  () => {
    const { search: searchQuery, limit, sort, category1, category2 } = getQuery();
    const category = { category1, category2 };

    // SSR일 때는 컨텍스트 데이터, CSR일 때는 Store 데이터 사용
    let products, loading, error, totalCount, categories;

    if (isSSR()) {
      const ssrData = getSSRData();
      products = ssrData?.products ?? [];
      categories = ssrData?.categories ?? {};
      totalCount = ssrData?.totalCount ?? 0;
      loading = false;
      error = null;
    } else {
      const productState = productStore.getState();
      products = productState.products;
      loading = productState.loading;
      error = productState.error;
      totalCount = productState.totalCount;
      categories = productState.categories;
    }

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
