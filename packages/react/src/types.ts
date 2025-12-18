import type { Product, Categories } from "./entities/products/types";

export type StringRecord = Record<string, string>;
export type AnyFunction = (...args: unknown[]) => unknown;

// Hydration용 초기 데이터 타입
export interface InitialData {
  products?: Product[];
  categories?: Categories;
  totalCount?: number;
  currentProduct?: Product;
  relatedProducts?: Product[];
}

declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
  }
}
