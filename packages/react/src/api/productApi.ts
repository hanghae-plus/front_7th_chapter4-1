// 상품 목록 조회
import type { Categories, Product } from "../entities";
import type { StringRecord } from "../types.ts";

// SSR에서는 절대 URL 필요
const API_BASE = typeof window === "undefined" ? "http://localhost:5176" : "";
const isServer = typeof window === "undefined";

// MSW 준비 대기 (클라이언트에서만)
const waitForMSW = async () => {
  if (isServer) return;

  // 이미 준비되었으면 바로 반환
  if (window.__MSW_READY__) return;

  // 최대 3초 대기
  const maxWait = 3000;
  const interval = 50;
  let waited = 0;

  while (!window.__MSW_READY__ && waited < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    waited += interval;
  }
};

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search: string;
    category1: string;
    category2: string;
    sort: string;
  };
}

export async function getProducts(params: StringRecord = {}): Promise<ProductsResponse> {
  await waitForMSW();

  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(`${API_BASE}/api/products?${searchParams}`);

  return await response.json();
}

// 상품 상세 조회
export async function getProduct(productId: string): Promise<Product> {
  await waitForMSW();

  const response = await fetch(`${API_BASE}/api/products/${productId}`);
  return await response.json();
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Categories> {
  await waitForMSW();

  const response = await fetch(`${API_BASE}/api/categories`);
  return await response.json();
}
