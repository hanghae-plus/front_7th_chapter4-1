/**
 * Mock API 함수들
 * - handlers.js의 로직을 함수로 분리하여 SSR에서 직접 호출 가능
 * - MSW handlers에서도 이 함수들을 재사용
 *
 * 참고: src/mocks/handlers.js
 */
import items from "./items.json";

/**
 * 카테고리 추출 함수
 * @returns {Object} { "패션의류": { "여성의류": {}, "남성의류": {} }, ... }
 */
export function mockGetCategories() {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

/**
 * 상품 필터링 함수 (내부용)
 * @param {Array} products - 상품 배열
 * @param {Object} query - { search, category1, category2, sort }
 * @returns {Array} 필터링된 상품 배열
 */
function filterProducts(products, query) {
  let filtered = [...products];

  // 1. 검색어 필터링 (title, brand)
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }
  // 2. 카테고리 필터링 (category1, category2)
  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }
  // 3. 정렬 (price_asc, price_desc, name_asc, name_desc)
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
        // 기본은 가격 낮은 순
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }
  return filtered;
}

/**
 * 상품 목록 조회
 * @param {Object} options - { page, limit, search, category1, category2, sort }
 * @returns {Object} { products, pagination, filters }
 */
export function mockGetProducts({
  page = 1,
  limit = 20,
  search = "",
  category1 = "",
  category2 = "",
  sort = "price_asc",
} = {}) {
  // 1. filterProducts로 필터링
  const filtered = filterProducts(items, { search, category1, category2, sort });

  // 2. 페이지네이션
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const paginatedProducts = filtered.slice(start, end);

  const pagination = {
    total,
    totalPages,
    currentPage,
    limit,
  };

  // 필터 정보
  const filters = {
    search,
    category1,
    category2,
    sort,
  };

  // 3. 결과 반환
  return {
    products: paginatedProducts,
    pagination,
    filters,
  };
}

/**
 * 상품 상세 조회
 * @param {string} id - 상품 ID (productId)
 * @returns {Object|null} 상품 상세 정보 또는 null
 */
export function mockGetProduct(id) {
  // 1. 상품 찾기
  const product = items.find((item) => item.productId === id);

  // 2. 없으면 null 반환
  if (!product) {
    return null;
  }

  // 3. 상세 정보 추가하여 반환
  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
    reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
    stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}
