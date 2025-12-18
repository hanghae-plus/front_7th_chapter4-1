// 상품 목록 조회
import type { Categories, Product } from "../entities";
import type { StringRecord } from "../types.ts";
import { isServer } from "../constants";

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

const getBaseUrl = (url: string) => {
  return isServer ? new URL(url, `http://localhost`) : url;
};

export async function getProducts(params: StringRecord = {}): Promise<ProductsResponse> {
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

  const url = getBaseUrl(`/api/products?${searchParams}`);
  const response = await fetch(url);

  return (await response.json()) as ProductsResponse;
}

// 상품 상세 조회
export async function getProduct(productId: string): Promise<Product> {
  const url = getBaseUrl(`/api/products/${productId}`);
  const response = await fetch(url);
  return (await response.json()) as Product;
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Categories> {
  const url = getBaseUrl("/api/categories");
  const response = await fetch(url);
  return (await response.json()) as Categories;
}
