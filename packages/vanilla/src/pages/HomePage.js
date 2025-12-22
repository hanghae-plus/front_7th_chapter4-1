import { ProductList, SearchBar } from "../components";
import { PRODUCT_ACTIONS, productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { getProducts, getCategories } from "../api/productApi";
import { PageWrapper } from "./PageWrapper.js";

const route = "/";

async function getServerSideProps({ query }) {
  const [productsRes, categories] = await Promise.all([getProducts(query), getCategories()]);

  return {
    props: {
      products: productsRes.products,
      categories,
      totalCount: productsRes.pagination.total,
    },
    head: {
      title: "쇼핑몰 - 홈",
      description: `${productsRes.pagination.total}개 상품`,
    },
  };
}

async function initializeStore(data) {
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...data,
      loading: false,
      status: "done",
    },
  });
}

async function hydrate() {
  if (import.meta.env.SSR) return;
  const data = window.__INITIAL_DATA__;
  initializeStore(data);
}

const initializeStoreFromSSR = initializeStore;

const renderHomePage = (props, _router = router) => {
  const productState = productStore.getState();
  const { search: searchQuery, limit, sort, category1, category2 } = _router.query;
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
};

const HomePageSSR = renderHomePage;

const HomePage = withLifecycle(
  {
    onMount: () => {
      if (window.__HYDRATED__) {
        window.__HYDRATED__ = false;
        return;
      }
      loadProductsAndCategories();
    },
    watches: [
      [
        () => {
          const { search, limit, sort, category1, category2 } = router.query;
          return [search, limit, sort, category1, category2];
        },
        () => loadProducts(true),
      ],
    ],
  },
  renderHomePage,
);

export default {
  route,
  hydrate,
  getServerSideProps,
  initializeStoreFromSSR,
  page: HomePage,
  ssrRender: HomePageSSR,
};
