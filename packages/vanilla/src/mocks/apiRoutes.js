import express from "express";
import items from "./items.json" with { type: "json" };

const delay = async () => await new Promise((resolve) => setTimeout(resolve, 200));

// 카테고리 추출 함수
function getUniqueCategories() {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

// 상품 검색 및 필터링 함수
function filterProducts(products, query) {
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
        // 기본은 가격 낮은 순
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

/**
 * Mock API 라우터 생성
 * 서버에서 같은 서버로 HTTP 요청을 보낼 때 Express가 처리하도록 함
 * MSW 핸들러와 동일한 로직을 사용하여 일관성 유지
 */
export function createMockApiRouter() {
  const router = express.Router();

  // 상품 목록 API
  router.get("/products", async (req, res) => {
    const page = parseInt(req.query.page ?? req.query.current) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const category1 = req.query.category1 || "";
    const category2 = req.query.category2 || "";
    const sort = req.query.sort || "price_asc";

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

    res.json(response);
  });

  // 상품 상세 API
  router.get("/products/:id", (req, res) => {
    const { id } = req.params;
    const product = items.find((item) => item.productId === id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 상세 정보에 추가 데이터 포함
    const detailProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand || ""} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
      reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
      stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    res.json(detailProduct);
  });

  // 카테고리 목록 API
  router.get("/categories", async (req, res) => {
    const categories = getUniqueCategories();
    await delay();
    res.json(categories);
  });

  return router;
}
