import { readFileSync } from "fs";
import { enhanceProductDetail, filterProducts, getUniqueCategories, paginateProducts } from "./productUtils.js";

const items = JSON.parse(readFileSync("./src/mocks/items.json", "utf-8"));

export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.page || 1;

  const filteredProducts = filterProducts(items, { search, category1, category2, sort });
  return paginateProducts(filteredProducts, page, limit);
}

export async function getProduct(productId) {
  const product = items.find((item) => item.productId === productId);
  if (!product) return null;

  return enhanceProductDetail(product);
}

export async function getCategories() {
  return getUniqueCategories(items);
}

export async function getRelatedProducts(category1, category2, currentProductId, limit = 20) {
  let related = items.filter((item) => {
    if (item.productId === currentProductId) return false;
    if (category2 && item.category2 === category2) return true;
    if (category1 && item.category1 === category1) return true;
    return false;
  });

  return related.slice(0, limit);
}
