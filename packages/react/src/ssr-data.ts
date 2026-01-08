import items from "./mocks/items.json" with { type: "json" };
import type { Product, Categories } from "./entities";
import type { StringRecord } from "./types";

// 상품 필터링 및 정렬 함수 (handlers.ts와 동일한 로직)
function filterProducts(products: Product[], query: Record<string, string>): Product[] {
  let filtered = [...products];

  // 검색어 필터링
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || (item.brand || "").toLowerCase().includes(searchTerm),
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

// 카테고리 추출 함수
function getUniqueCategories(): Categories {
  const categories: Categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) {
      categories[cat1] = {};
    }
    if (cat2 && !categories[cat1][cat2]) {
      categories[cat1][cat2] = {};
    }
  });

  return categories;
}

export interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

export interface ProductDetailData {
  product: Product;
  relatedProducts: Product[];
}

/**
 * 홈페이지 데이터 로드
 */
export async function loadHomePageData(url: string, query: StringRecord = {}): Promise<HomePageData | null> {
  try {
    const page = parseInt(query.page ?? query.current ?? "1");
    const limit = parseInt(query.limit ?? "20");
    const search = query.search || "";
    const category1 = query.category1 || "";
    const category2 = query.category2 || "";
    const sort = query.sort || "price_asc";

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

    // 카테고리 목록
    const categories = getUniqueCategories();

    return {
      products: paginatedProducts,
      categories,
      totalCount: filteredProducts.length,
    };
  } catch (error) {
    console.error("홈페이지 데이터 로드 실패:", error);
    return null;
  }
}

/**
 * 상품 상세 페이지 데이터 로드
 */
export async function loadProductDetailData(productId: string): Promise<ProductDetailData | null> {
  try {
    const product = items.find((item) => item.productId === productId);

    if (!product) {
      return null;
    }

    // 상세 정보에 추가 데이터 포함 (handlers.ts와 동일)
    const detailProduct: Product = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand || ""} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    // 관련 상품 로드 (같은 category2)
    let relatedProducts: Product[] = [];
    if (detailProduct.category2) {
      const related = filterProducts(items, {
        category2: detailProduct.category2,
        sort: "price_asc",
      });

      // 현재 상품 제외
      relatedProducts = related.filter((p) => p.productId !== productId).slice(0, 20); // 최대 20개
    }

    return {
      product: detailProduct,
      relatedProducts,
    };
  } catch (error) {
    console.error("상품 상세 데이터 로드 실패:", error);
    return null;
  }
}
