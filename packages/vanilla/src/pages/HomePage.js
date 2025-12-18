import { ProductList, SearchBar } from "../components";
import { getActiveStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

/**
 * 홈페이지 컴포넌트
 *
 * SSR/CSR에서 폼 값(검색어, 정렬, 카테고리 등) 처리 전략:
 *
 * SSR 시점:
 * - router.query는 빈 객체 (서버에서 브라우저 라우터 사용 불가)
 * - prefetchData에서 쿼리 파라미터를 파싱하여 스토어에 저장
 * - 컴포넌트는 스토어에서 폼 값을 읽음
 *
 * CSR 시점:
 * - router.query에 현재 URL의 쿼리 파라미터가 있음
 * - 스토어의 폼 값(searchQuery 등)은 undefined
 * - 컴포넌트는 router.query에서 폼 값을 읽음
 *
 * 따라서 `productState.searchQuery ?? routerQuery.search ?? ""` 패턴으로
 * SSR과 CSR 모두에서 올바른 값을 얻습니다.
 */
export const HomePage = withLifecycle(
  {
    onMount: () => {
      loadProductsAndCategories();
    },
    watches: [
      // 쿼리 파라미터 변경 감지
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      // 변경 시 상품 목록 다시 로드
      () => loadProducts(true),
    ],
  },
  () => {
    // SSR/CSR 환경에 따라 적절한 스토어 사용
    const productState = getActiveStore().getState();
    const routerQuery = router.query;

    // 폼 값 결정: SSR(스토어) → CSR(라우터) → 기본값 순서로 폴백
    const searchQuery = productState.searchQuery ?? routerQuery.search ?? "";
    const limit = productState.limit ?? routerQuery.limit ?? 20;
    const sort = productState.sort ?? routerQuery.sort ?? "price_asc";
    const category1 = productState.category1 ?? routerQuery.category1 ?? "";
    const category2 = productState.category2 ?? routerQuery.category2 ?? "";

    // 상품 데이터
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
