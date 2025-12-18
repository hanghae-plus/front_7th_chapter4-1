// pages/HomePage.js

import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

/** ✅ SSR-safe (서버/클라 공용): window/router 직접 접근 금지 */
export function HomePageView({ store, query }) {
  const productState = store.getState();

  const { search: searchQuery = "", limit = 20, sort = "price_asc", category1 = "", category2 = "" } = query || {};

  const { products, loading, error, totalCount, categories } = productState;

  const category = { category1, category2 };
  const hasMore = (products?.length ?? 0) < (totalCount ?? 0);

  return PageWrapper({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
    children: `
      ${SearchBar({ searchQuery, limit, sort, category, categories })}
      <div class="mb-6">
        ${ProductList({ products, loading, error, totalCount, hasMore })}
      </div>
    `.trim(),
  });
}

/** ✅ 클라 전용: withLifecycle + router.query 사용 OK */
export const HomePageClient = withLifecycle(
  {
    onMount: () => {
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  () => HomePageView({ store: productStore, query: router.query }),
);

export const HomePage = HomePageClient;
