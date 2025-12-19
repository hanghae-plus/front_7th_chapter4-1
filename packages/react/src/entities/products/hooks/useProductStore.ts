import { createStore, type StringRecord } from "@hanghae-plus/lib";
import { createContext, useContext } from "react";
import { initialProductState } from "../productStore";

export type ProductStore = {
  store: ReturnType<typeof createStore<typeof initialProductState, unknown>>;
  state: typeof initialProductState;
  action: {
    loadProducts: (resetList?: boolean) => Promise<void>;
    loadProductsAndCategories: () => Promise<void>;
    searchProducts: (search: string) => void;
    setCategory: (category: StringRecord) => void;
    setSort: (sort: string) => void;
    setLimit: (limit: number) => void;
    loadProductDetailForPage: (productId: string) => void;
    loadRelatedProducts: (category2: string, excludeProductId: string) => void;
    loadNextProducts: () => void;
  };
};

export const ProductStoreContext = createContext<ProductStore | null>(null);

export const useProductStoreContext = () => {
  const productStore = useContext(ProductStoreContext);
  if (!productStore) {
    throw new Error("ProductStoreContext not found");
  }
  return productStore;
};
