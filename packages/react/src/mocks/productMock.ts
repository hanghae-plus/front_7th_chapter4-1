import items from "./items.json" with { type: "json" };
import { delay } from "./utils.ts";
import type { Product } from "../entities";
import type { StringRecord } from "../types";

// Utils
// 상품 검색 및 필터링 함수
function filterProducts(products: Product[], query: StringRecord) {
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
        // 기본은 가격 낮은 순
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

// Mock APIs

/**
 * 상품 목록 조회
 * @param {Object} params - URL 파라미터
 * @param {number} params.page - 페이지 번호
 * @param {number} params.limit - 페이지당 상품 수
 * @param {string} params.search - 검색어
 * @param {string} params.category1 - 카테고리1
 * @param {string} params.category2 - 카테고리2
 * @param {string} params.sort - 정렬 방식
 * @returns {Promise<Object>} 상품 목록
 */
export async function getProductsMock(params: URLSearchParams) {
  const page = parseInt(params.get("page") ?? params.get("current") ?? "1") || 1;
  const limit = parseInt(params.get("limit") ?? "20") || 20;
  const search = params.get("search") || "";
  const category1 = params.get("category1") || "";
  const category2 = params.get("category2") || "";
  const sort = params.get("sort") || "price_asc";

  // 필터링된 상품들
  const filteredProducts = filterProducts(items, {
    search,
    category1,
    category2,
    sort,
  });

  // 페이지네이션
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 응답 데이터
  const response = {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: page > 1,
    },
    filters: {
      search,
      category1,
      category2,
      sort,
    },
  };

  await delay();

  return response;
}

export async function getProductMock(id: string) {
  const product = items.find((item) => item.productId === id);

  if (!product) {
    throw new Error("Product not found");
  }

  // 상세 정보에 추가 데이터 포함
  const detailProduct = {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
    reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
    stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };

  return detailProduct;
}
