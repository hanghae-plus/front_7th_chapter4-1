/**
 * 카테고리 유틸리티 함수
 * SSR/SSG/API 핸들러에서 공통으로 사용
 */
import type { Product, Categories } from "../entities/products/types";

/**
 * 상품 목록에서 고유한 카테고리 구조 추출
 */
export function getUniqueCategories(items: Product[]): Categories {
  const categories: Record<string, Record<string, string>> = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (cat1 && !categories[cat1]) {
      categories[cat1] = {};
    }
    if (cat1 && cat2 && !categories[cat1][cat2]) {
      categories[cat1][cat2] = cat2;
    }
  });

  return categories as Categories;
}
