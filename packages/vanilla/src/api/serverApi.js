import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
// ES Module에서 __dirname 만들기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 1. items.json 파일 경로 찾기
const itemsPath = path.join(__dirname, "../mocks/items.json");
// 2. 파일 읽기
export async function loadItems() {
  const data = await fs.readFile(itemsPath, "utf-8");
  return JSON.parse(data);
}

export async function getCategoriesFromFile() {
  const items = await loadItems(); // ← items 가져오기!
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

export async function getProductByIdFromFile(productId) {
  const items = await loadItems();
  return items.find((item) => item.productId === productId);
}

export function filterProducts(products, query) {
  // 상품 검색 및 필터링 함수
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

export async function getProductsFromFile(params = {}) {
  const items = await loadItems();
  const { limit = 20, page = 1, current } = params;
  const actualPage = current ?? page;

  // 1. 필터링 및 정렬
  const filtered = filterProducts(items, params);

  // 2. 페이지네이션
  const startIndex = (actualPage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  // 3. 응답 데이터
  return {
    products: paginatedProducts,
    pagination: {
      page: actualPage,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      hasNext: endIndex < filtered.length,
      hasPrev: actualPage > 1,
    },
  };
}
