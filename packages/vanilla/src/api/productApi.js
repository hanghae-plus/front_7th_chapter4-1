// 서버/클라이언트 환경에 따라 base URL 결정
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // 클라이언트: 상대 경로 사용
    return "";
  }
  // 서버: 로컬호스트 사용 (MSW가 인터셉트)
  return `http://localhost:${process.env.PORT || 5174}`;
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
