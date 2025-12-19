import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import type { ClientRouter, ServerRouter } from "./router";
import type { FunctionComponent } from "react";

type ApplicationRouter = ClientRouter<FunctionComponent> | ServerRouter<FunctionComponent>;

export const initRoutes = (router: ApplicationRouter) => {
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);
};
