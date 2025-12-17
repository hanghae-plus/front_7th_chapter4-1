import { PRODUCT_ACTIONS, productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { HomePageComponent } from "./common/HomePageComponent.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      if (window.__INITIAL_DATA__) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            products: window.__INITIAL_DATA__.products,
            categories: window.__INITIAL_DATA__.categories,
            totalCount: window.__INITIAL_DATA__.pagination.total,
            loading: false,
            status: "done",
          },
        });
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

    return HomePageComponent({
      search: { searchQuery, limit, sort, category, categories },
      productData: {
        products,
        loading,
        error,
        totalCount,
        hasMore,
      },
    });
  },
);
