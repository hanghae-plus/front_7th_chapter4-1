import { http, HttpResponse } from "msw";
import { getProductMock, getProductsMock } from "./productMock.js";
import { getCategoriesMock } from "./categoryMock.js";

const API_BASE = "*/api";

export const handlers = [
  // 상품 목록 API
  http.get(`${API_BASE}/products`, async ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(await getProductsMock(url.searchParams));
  }),

  // 상품 상세 API
  http.get(`${API_BASE}/products/:id`, async ({ params }) => {
    const { id } = params;
    try {
      const product = await getProductMock(id);
      return HttpResponse.json(product);
    } catch {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }
  }),

  // 카테고리 목록 API
  http.get(`${API_BASE}/categories`, async () => {
    return HttpResponse.json(await getCategoriesMock());
  }),
];
