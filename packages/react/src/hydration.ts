import { PRODUCT_ACTIONS, productStore } from "./entities";

export function hydrateFromServerData() {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;
    if (data.products) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: data.products,
          categories: data.categories,
          totalCount: data.totalCount,
          loading: false,
          status: "done",
        },
      });
    }
    if (data.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
    }
    if (data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }

    delete window.__INITIAL_DATA__;
  }
}
