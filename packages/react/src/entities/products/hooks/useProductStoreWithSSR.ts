import { useContext } from "react";
import { InitialDataContext } from "../../../contexts/InitialDataContext";
import { useProductStore } from "./useProductStore";
import type { Categories, Product } from "../types";

interface ProductStoreState {
  products: Product[];
  totalCount: number;
  currentProduct: Product | null;
  relatedProducts: Product[];
  loading: boolean;
  error: string | null;
  status: string;
  categories: Categories;
}

/**
 * SSR과 CSR을 모두 지원하는 Product Store Hook
 *
 * - SSR/Hydration: InitialDataContext에서 데이터 사용
 * - CSR Navigation: productStore에서 데이터 사용
 */
export const useProductStoreWithSSR = (): ProductStoreState => {
  const initialData = useContext(InitialDataContext);
  const storeData = useProductStore();

  // SSR/Hydration - HomePage 데이터
  if (initialData && "products" in initialData) {
    return {
      products: initialData.products,
      categories: initialData.categories,
      totalCount: initialData.totalCount,
      currentProduct: null,
      relatedProducts: [],
      loading: false,
      error: null,
      status: "done",
    };
  }

  // SSR/Hydration - ProductDetailPage 데이터
  if (initialData && "currentProduct" in initialData) {
    return {
      products: [],
      categories: {},
      totalCount: 0,
      currentProduct: initialData.currentProduct,
      relatedProducts: initialData.relatedProducts,
      loading: false,
      error: null,
      status: "done",
    };
  }

  // CSR - Store 사용
  return storeData;
};
