import { isServer } from "../utils";
import { MemoryRouter, Router } from "../lib";
import { BASE_URL } from "../constants";
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";

export const createRouter = () => {
  const CurrentRouter = isServer() ? MemoryRouter : Router;

  return new CurrentRouter(BASE_URL);
};

export const initRoutes = (router) => {
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);
};
