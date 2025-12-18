// packages/vanilla/src/pages/HomePage.js

import { ProductList, SearchBar } from "../components/index.js";
import { productStore } from "../stores/index.js";
import { router, withLifecycle } from "../router/index.js"; 
import { loadProducts, loadProductsAndCategories } from "../services/index.js"; 
import { PageWrapper } from "./PageWrapper.js";

const HomePageComponent = withLifecycle(
  {
    onMount: () => {
      console.log("✅ HomePage mounted.");
      
      // [핵심 수정] SSR 최적화 & Double Fetch 방지
      // 이미 스토어에 상품 데이터가 있다면(SSR로 받아왔다면) 다시 요청하지 않습니다.
      const state = productStore.getState();
      if (!state.products || state.products.length === 0) {
        console.log("Fetching data on client...");
        loadProductsAndCategories();
      } else {
        console.log("Data already loaded via SSR. Skipping client fetch.");
      }
    },
    
    watches: [
      () => {
        // 라우터 쿼리 변경 감지
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      // 쿼리 변경 시에만 상품 목록 재로드
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
    });
  },
);

/**
 * [SSR 필수] 서버 사이드 데이터 프리패칭
 */
HomePageComponent.fetchData = async ({ store, query }) => {
  // 서비스를 통해 데이터를 가져오고 스토어에 주입합니다.
  await loadProductsAndCategories(query, store);
};

export const HomePage = HomePageComponent;