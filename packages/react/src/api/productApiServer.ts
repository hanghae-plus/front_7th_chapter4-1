/**
 * 서버 사이드용 API 호출 함수
 * Node.js 환경에서 직접 데이터를 가져옵니다
 */
import items from "../mocks/items.json";

// 카테고리 추출 함수
function getUniqueCategories() {
  const categories: Record<string, Record<string, Record<string, never>>> = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

// 상품 검색 및 필터링 함수
function filterProducts(
  products: typeof items,
  query: {
    search?: string;
    category1?: string;
    category2?: string;
    sort?: string;
  },
) {
  let filtered = [...products];

  // 검색어 필터링
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) || (item.brand && item.brand.toLowerCase().includes(searchTerm)),
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

export function getProducts(params: Record<string, string | number> = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 필터링된 상품들
  const filteredProducts = filterProducts(items, {
    search: search as string,
    category1: category1 as string,
    category2: category2 as string,
    sort: sort as string,
  });

  // 페이지네이션
  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 응답 데이터
  return {
    products: paginatedProducts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / Number(limit)),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: Number(page) > 1,
    },
    filters: {
      search,
      category1,
      category2,
      sort,
    },
  };
}

export function getProduct(productId: string) {
  const product = items.find((item) => item.productId === productId);

  if (!product) {
    throw new Error("Product not found");
  }

  // 상세 정보에 추가 데이터 포함
  // description은 items.json에 없으면 생성하지 않음 (UI에서 선택적 표시)
  const detailProduct = {
    ...product,
    // description은 원본 데이터에 있으면 사용, 없으면 undefined (UI에서 처리)
    ...(product.description && { description: product.description }),
    rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
    reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
    stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };

  return detailProduct;
}

export function getCategories() {
  return getUniqueCategories();
}

export function getAllProductIds() {
  return items.map((item) => item.productId);
}
