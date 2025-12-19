/**
 * 상품 필터링 유틸리티
 * handlers.js와 static-site-generate.js에서 공통으로 사용
 */
import type { Product } from "../entities/products/types";

/**
 * 상품 목록 필터링 및 정렬
 */
export function filterProducts(products: Product[], query: Record<string, string> = {}): Product[] {
  const { search = "", category1 = "", category2 = "", sort = "price_asc" } = query;
  let filtered = [...products];

  // 검색 필터
  if (search) {
    const searchTerm = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) || (item.brand && item.brand.toLowerCase().includes(searchTerm)),
    );
  }

  // 카테고리 필터
  if (category1) {
    filtered = filtered.filter((item) => item.category1 === category1);
  }
  if (category2) {
    filtered = filtered.filter((item) => item.category2 === category2);
  }

  // 정렬
  switch (sort) {
    case "price_asc":
      filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
      break;
    case "price_desc":
      filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
      break;
    case "name_asc":
      filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      break;
    case "name_desc":
      filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
      break;
    default:
      filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
  }

  return filtered;
}
