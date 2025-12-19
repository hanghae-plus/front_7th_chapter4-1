// 상품 목록 조회
import type { Categories, Product } from "../entities";
import type { StringRecord } from "../types.ts";

/**
 * API 응답 검증 및 에러 처리
 * @param response - fetch 응답 객체
 * @param endpoint - API 엔드포인트 (에러 메시지용)
 */
async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorText}`);
  }
  return response.json();
}

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

export async function getProducts(params: StringRecord = {}, baseUrl = ""): Promise<ProductsResponse> {
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

  const endpoint = `/api/products?${searchParams}`;
  const response = await fetch(`${baseUrl}${endpoint}`);

  return handleResponse<ProductsResponse>(response, endpoint);
}

// 상품 상세 조회
export async function getProduct(productId: string, baseUrl = ""): Promise<Product> {
  const endpoint = `/api/products/${productId}`;
  const response = await fetch(`${baseUrl}${endpoint}`);
  return handleResponse<Product>(response, endpoint);
}

// 카테고리 목록 조회
export async function getCategories(baseUrl = ""): Promise<Categories> {
  const endpoint = `/api/categories`;
  const response = await fetch(`${baseUrl}${endpoint}`);
  return handleResponse<Categories>(response, endpoint);
}
