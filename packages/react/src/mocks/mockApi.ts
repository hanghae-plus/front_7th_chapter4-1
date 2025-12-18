/**
 * Mock API 함수들
 * - handlers.ts의 로직을 함수로 분리하여 SSR에서 직접 호출 가능
 * - MSW는 브라우저에서만 작동하므로, 서버에서는 이 함수들을 직접 호출
 *
 * 참고: src/mocks/handlers.ts
 */
import items from "./items.json";
import type { Product, Categories } from "../entities";

interface ProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category1?: string;
  category2?: string;
  sort?: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  filters: {
    search: string;
    category1: string;
    category2: string;
    sort: string;
  };
}

/**
 * 카테고리 목록 반환
 */
export function mockGetCategories(): Categories {
  const categories: Categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

/**
 * 상품 필터링 (내부용)
 */
function filterProducts(products: Product[], query: ProductsQuery): Product[] {
  let filtered = [...products];

  // 검색어 필터링
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  // 카테고리 필터링
  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  // 정렬
  if (query.sort) {
    switch (query.sort) {
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
  }

  return filtered;
}

/**
 * 상품 목록 조회
 */
export function mockGetProducts({
  page = 1,
  limit = 20,
  search = "",
  category1 = "",
  category2 = "",
  sort = "price_asc",
}: ProductsQuery = {}): ProductsResponse {
  const filtered = filterProducts(items as Product[], { search, category1, category2, sort });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.min(Math.max(page, 1), totalPages || 1);

  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const paginatedProducts = filtered.slice(start, end);

  return {
    products: paginatedProducts,
    pagination: { total, totalPages, currentPage, limit },
    filters: { search, category1, category2, sort },
  };
}

/**
 * 상품 상세 조회
 */
export function mockGetProduct(id: string): Product | null {
  const product = (items as Product[]).find((item) => item.productId === id);

  if (!product) return null;

  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}
