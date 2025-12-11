import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";
import type { RouterInstance } from "@hanghae-plus/lib";

export const initRoutes = (router: RouterInstance) => {
  // 홈 페이지 (상품 목록)
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);
};
