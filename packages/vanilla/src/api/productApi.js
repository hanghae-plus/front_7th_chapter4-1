/**
 * API 응답 검증 및 에러 처리
 * @param {Response} response - fetch 응답 객체
 * @param {string} endpoint - API 엔드포인트 (에러 메시지용)
 */
async function handleResponse(response, endpoint) {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorText}`);
  }
  return response.json();
}

export async function getProducts(params = {}, baseUrl = "") {
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

  return handleResponse(response, endpoint);
}

export async function getProduct(productId, baseUrl = "") {
  const endpoint = `/api/products/${productId}`;
  const response = await fetch(`${baseUrl}${endpoint}`);
  return handleResponse(response, endpoint);
}

export async function getCategories(baseUrl = "") {
  const endpoint = `/api/categories`;
  const response = await fetch(`${baseUrl}${endpoint}`);
  return handleResponse(response, endpoint);
}
