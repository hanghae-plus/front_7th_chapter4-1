import { ProductList, SearchBar } from "../components";
import { useProductService } from "../services";
import { PageWrapper } from "./PageWrapper";
import { withLifecycle } from "../lib";
import { RouterContext, StoreContext } from "../contexts";

const getProductState = () => StoreContext.use().productStore.getState();
const getQuery = () => RouterContext.use().query;

export const HomePage = withLifecycle(
  {
    async getServerProps({ router }) {
      const { productService } = await import("../mocks/server");
      const {
        products,
        pagination: { total: totalCount },
      } = await productService.getProducts(router.query);

      const categories = await productService.getCategories();

      const head = "<title>쇼핑몰 - 홈</title>";

      return { products, categories, totalCount, head };
    },
    onMount: () => {
      // 서버에서 하이드레이션된 데이터가 있으면 로딩하지 않음
      const productService = useProductService();
      const currentState = getProductState();
      document.title = "쇼핑몰 - 홈";

      if (currentState.products.length === 0 || currentState.status !== "done") {
        productService.loadProductsAndCategories();
      }
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = getQuery();
        return [search, limit, sort, category1, category2];
      },
      () => useProductService().loadProducts(true),
    ],
  },
  () => {
    const productState = getProductState();

    const {
      search: searchQuery = "",
      limit = "20",
      sort = "recent",
      category1 = "",
      category2 = "",
    } = getQuery() || {};

    const { products = [], loading = false, error = null, totalCount = 0, categories = [] } = productState;
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
