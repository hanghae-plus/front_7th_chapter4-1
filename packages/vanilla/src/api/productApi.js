const getBaseUrl = () => {
  if (import.meta.env.SSR) {
    return "http://localhost:5173";
  }
  return "";
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

  const response = await fetch(`${getBaseUrl()}/api/products?${searchParams}`);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return await response.json();
}

export async function getProduct(productId) {
  const response = await fetch(`${getBaseUrl()}/api/products/${productId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }
  return await response.json();
}

export async function getCategories() {
  const response = await fetch(`${getBaseUrl()}/api/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return await response.json();
}
