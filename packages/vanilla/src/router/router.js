// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL, isServer } from "../constants.js";
import { HomePage, ProductDetailPage, NotFoundPage } from "../pages";
import { ServerRouter } from "../lib/ServerRouter.js";

export const routes = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  "*": NotFoundPage,
};

export const router = isServer ? new ServerRouter(routes) : new Router(routes, BASE_URL);
