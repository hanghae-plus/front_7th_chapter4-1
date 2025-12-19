import { readFileSync } from "fs";
import type { Categories, Product } from "../entities/products/types";
import { enhanceProductDetail, filterProducts, getUniqueCategories, paginateProducts } from "./productUtils.js";

const items: Product[] = JSON.parse(readFileSync("./src/mocks/items.json", "utf-8"));

interface GetProductsParams {
  limit?: number;
  search?: string;
  category1?: string;
  category2?: string;
  sort?: string;
  page?: number;
}

export async function getProducts(params: GetProductsParams = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.page || 1;

  const filteredProducts = filterProducts(items, { search, category1, category2, sort });
  return paginateProducts(filteredProducts, page, limit);
}

export async function getProduct(productId: string) {
  const product = items.find((item) => item.productId === productId);
  if (!product) return null;

  return enhanceProductDetail(product);
}

export async function getCategories(): Promise<Categories> {
  return getUniqueCategories(items);
}

export async function getRelatedProducts(
  category1: string,
  category2: string,
  currentProductId: string,
  limit = 20,
): Promise<Product[]> {
  const related = items.filter((item) => {
    if (item.productId === currentProductId) return false;
    if (category2 && item.category2 === category2) return true;
    if (category1 && item.category1 === category1) return true;
    return false;
  });

  return related.slice(0, limit);
}
