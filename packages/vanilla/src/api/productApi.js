import { isServer } from "../constants.js";

const getBaseUrl = (url) => {
  return isServer ? new URL(url, `http://localhost`) : url;
};

export async function getProducts(params = {}) {
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

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/products?${searchParams}`;

  const response = await fetch(url);

  return await response.json();
}

export async function getProduct(productId) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/categories`);
  return await response.json();
}
