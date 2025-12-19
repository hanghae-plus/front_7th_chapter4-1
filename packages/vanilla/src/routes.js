import { router } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";

export const initRoutes = () => {
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);
};
