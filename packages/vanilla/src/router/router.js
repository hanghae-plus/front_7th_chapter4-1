// 글로벌 라우터 인스턴스
import { ClientRouter, ServerRouter } from "../lib";
import { BASE_URL } from "../constants.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";

const isServer = typeof window === "undefined";
export const router = createRouter(isServer ? ServerRouter : ClientRouter, BASE_URL);

/**
 * 유니버셜 라우터 인스턴스 생성
 * @param {typeof ClientRouter | typeof ServerRouter} RouterClass
 * @param {string} baseUrl
 * @returns { ClientRouter | ServerRouter  }
 */
export function createRouter(RouterClass = ClientRouter, baseUrl = BASE_URL) {
  const router = new RouterClass(baseUrl);

  // 홈 페이지 (상품 목록)
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  return router;
}
