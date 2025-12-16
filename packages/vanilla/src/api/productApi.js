// 서버 사이드에서 사용할 포트 (환경 변수 또는 기본값)
const getBaseUrl = () => {
  if (typeof process !== "undefined" && process.env.PORT) {
    return `http://localhost:${process.env.PORT}`;
  }
  return ""; // 클라이언트 사이드에서는 상대 경로 사용
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
  const response = await fetch(`${baseUrl}/api/products?${searchParams}`);

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
