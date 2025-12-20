import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router as clientRouter, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";
import { getProducts, getCategories } from "../api/productApi.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      // 서버에서 이미 데이터가 들어왔으면 데이터 로딩 안함
      if (clientRouter.query.current === undefined && productStore.getState().products.length > 0) return;
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
  (serversideProps, serverRouter) => {
    const router = serverRouter || clientRouter;
    const productState = serversideProps || productStore.getState();
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

HomePage.loader = async (serverRouter) => {
  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(serverRouter.query), getCategories()]);
  return { data: { products, categories, totalCount: total }, title: "쇼핑몰 - 홈" };
};
