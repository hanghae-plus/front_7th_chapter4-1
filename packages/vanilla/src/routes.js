import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";

export default [
  {
    path: "/",
    component: HomePage,
  },
  {
    path: "/product/:id/",
    component: ProductDetailPage,
  },
  {
    path: ".*",
    component: NotFoundPage,
  },
];
