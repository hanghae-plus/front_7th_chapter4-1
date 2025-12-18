import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";
import type { HomePageData, ProductDetailData, InitialData } from "./ssr-data";

declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
  }
}

function isHomePageData(data: InitialData): data is HomePageData {
  return data !== null && "products" in data && "categories" in data && "totalCount" in data;
}

function isProductDetailData(data: InitialData): data is ProductDetailData {
  return data !== null && "currentProduct" in data && "relatedProducts" in data;
}

export function hydrateFromServerData(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const initialData = window.__INITIAL_DATA__;

  if (!initialData) {
    return false;
  }

  if (isHomePageData(initialData)) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products,
        categories: initialData.categories,
        totalCount: initialData.totalCount,
        loading: false,
        status: "done",
      },
    });
    return true;
  }

  if (isProductDetailData(initialData)) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        currentProduct: initialData.currentProduct,
        relatedProducts: initialData.relatedProducts,
        loading: false,
        status: "done",
      },
    });
    return true;
  }

  return false;
}

export function cleanupInitialData(): void {
  if (typeof window !== "undefined") {
    delete window.__INITIAL_DATA__;
  }
}
