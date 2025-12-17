import type { Product, Categories } from "../entities/products/types";
import type { Cart } from "../entities/carts/types";

declare global {
  interface Window {
    __INITIAL_DATA__?: {
      // Product store state
      products: Product[];
      categories: Categories;
      totalCount: number;
      product: {
        products: Product[];
        totalCount: number;
        currentProduct: Product | null;
        relatedProducts: Product[];
        loading: boolean;
        error: string | null;
        status: string;
        categories: Categories;
      };
      // Cart store state
      cart: {
        items: Cart[];
        selectedAll: boolean;
      };
      // Route information
      route: {
        url: string;
        query: Record<string, string>;
        params: Record<string, string>;
      };
    };
  }
}

export {};
