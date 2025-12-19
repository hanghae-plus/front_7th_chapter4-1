import { renderToString } from "react-dom/server";
import { ServerRouter } from "./router/serverRouter";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./entities/products/productStore";
import { ModalProvider, ToastProvider } from "./components";
import { loadHomePageData, loadProductDetailData, type InitialData } from "./ssr-data";
import type { StringRecord } from "./types";
import { QueryProvider } from "./contexts/QueryContext";

const BASE_URL = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/react" : "";

const serverRouter = new ServerRouter(BASE_URL);

serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id/", ProductDetailPage);
serverRouter.addRoute(".*", NotFoundPage);

const ServerApp = ({ router, query }: { router: ServerRouter; query: StringRecord }) => {
  const PageComponent = router.target;

  return (
    <QueryProvider initialQuery={query}>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
      </ToastProvider>
    </QueryProvider>
  );
};

function generateHead(url: string): string {
  const isProductDetail = url.includes("/product/");

  if (isProductDetail) {
    const product = productStore.getState().currentProduct;
    if (product) {
      return `
        <title>${product.title} - 쇼핑몰</title>
        <meta name="description" content="${product.title} - ${product.brand}" />
      `;
    }
  }

  return `
    <title>쇼핑몰 - 홈</title>
    <meta name="description" content="다양한 상품을 만나보세요" />
  `;
}

export const render = async (
  url: string,
  query: StringRecord,
): Promise<{ html: string; head: string; initialData: InitialData }> => {
  serverRouter.navigate(url, query);

  let initialData: InitialData = null;

  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      loading: false,
      status: "done",
    },
  });

  const isHomePage = serverRouter.route?.path === "/";
  const isProductDetail = serverRouter.route?.path === "/product/:id/";

  if (isHomePage) {
    const homeData = await loadHomePageData(query);
    initialData = homeData;

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: homeData.products,
        categories: homeData.categories,
        totalCount: homeData.totalCount,
        loading: false,
        status: "done",
      },
    });
  } else if (isProductDetail) {
    const productId = serverRouter.params.id;
    if (productId) {
      const productData = await loadProductDetailData(productId);
      initialData = productData;

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          currentProduct: productData.currentProduct,
          relatedProducts: productData.relatedProducts,
          loading: false,
          status: "done",
        },
      });
    }
  }

  const html = renderToString(<ServerApp router={serverRouter} query={query} />);
  const head = generateHead(url);

  return { html, head, initialData };
};
