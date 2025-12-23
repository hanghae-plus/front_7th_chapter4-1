import type { Product, Categories } from "./entities";

interface HomePageInitialData {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

interface ProductDetailInitialData {
  product: Product;
  relatedProducts: Product[];
}

type InitialData = HomePageInitialData | ProductDetailInitialData | Record<string, unknown>;

declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
    __HYDRATED__?: boolean;
  }
}

export {};
