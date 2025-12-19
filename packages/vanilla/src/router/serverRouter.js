import { ServerRouter } from "../lib";
import { HomePage, ProductDetailPage, NotFoundPage } from "../pages";

export const serverRouter = new ServerRouter();

serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id/", ProductDetailPage);
serverRouter.addRoute(".*", NotFoundPage);
