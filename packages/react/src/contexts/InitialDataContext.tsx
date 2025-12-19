import { createContext } from "react";
import type { Categories, Product } from "../entities";

// 페이지별 데이터 타입 정의
export interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

export interface ProductDetailPageData {
  currentProduct: Product;
  relatedProducts: Product[];
}

// 통합 타입 (Union Type)
export type PageData = HomePageData | ProductDetailPageData | undefined;

// Context 생성
export const InitialDataContext = createContext<PageData>(undefined);

// Provider 컴포넌트
export const InitialDataProvider = InitialDataContext.Provider;
