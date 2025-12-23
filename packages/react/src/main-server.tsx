import { renderToString } from "react-dom/server";
import { pageConfigs, type SSRContext } from "./pages/page-configs";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { ModalProvider, ToastProvider } from "./components";
import type { ComponentType, FunctionComponent } from "react";
import { createSSRRouter, syncServerRouter } from "./router";

const routeComponents: Record<string, ComponentType> = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  "/404": NotFoundPage,
};

/**
 * Register routes to the given router instance.
 * Routes are registered once per router instance (addRoute prevents duplicates).
 */
function registerRoutes(router: ReturnType<typeof createSSRRouter>) {
  Object.keys(pageConfigs).forEach((route) => {
    const config = pageConfigs[route];
    router.addRoute(route, routeComponents[route] as FunctionComponent, {
      getServerSideProps: config.getServerSideProps,
      initializeStoreFromSSR: config.initializeStoreFromSSR,
    });
  });
}

export const render = async (url: string) => {
  // Create a fresh router for each request to avoid state pollution
  const router = createSSRRouter(url);
  registerRoutes(router);

  // Sync the singleton router so hooks (useRouterQuery etc.) get correct values
  syncServerRouter(url);

  // Router is already synced with the URL from createSSRRouter
  router.sync(url);

  const ctx: SSRContext = {
    params: router.params,
    query: router.query,
  };

  const matchedRoute = router.route;
  const getServerSideProps = matchedRoute?.meta?.getServerSideProps as
    | ((ctx: SSRContext) => Promise<{
        props?: Record<string, unknown>;
        head?: { title: string; description: string };
        notFound?: boolean;
      }>)
    | undefined;

  const serverSideData = getServerSideProps
    ? await getServerSideProps(ctx)
    : { props: {}, head: undefined, notFound: false };

  if (serverSideData.notFound) {
    const notFoundHtml = renderToString(
      <ToastProvider>
        <ModalProvider>
          <NotFoundPage />
        </ModalProvider>
      </ToastProvider>,
    );

    return {
      html: notFoundHtml,
      head: `<title>페이지를 찾을 수 없습니다</title><meta name="description" content="404 Not Found">`,
      initialDataScript: "",
      statusCode: 404,
    };
  }

  const initializeStoreFromSSR = matchedRoute?.meta?.initializeStoreFromSSR as
    | ((data: Record<string, unknown>) => void)
    | undefined;
  if (initializeStoreFromSSR && serverSideData.props) {
    initializeStoreFromSSR(serverSideData.props);
  }

  const props = serverSideData.props ?? {};
  const head = serverSideData.head ?? { title: "쇼핑몰", description: "상품 목록" };

  const PageComponent = router.target as ComponentType | undefined;

  const html = PageComponent
    ? renderToString(
        <ToastProvider>
          <ModalProvider>
            <PageComponent />
          </ModalProvider>
        </ToastProvider>,
      )
    : "<div>Not Found</div>";

  const initialDataScript = getServerSideProps
    ? `<script>window.__INITIAL_DATA__=${JSON.stringify(props)};window.__HYDRATED__=true;</script>`
    : "";

  return {
    html,
    head: `<title>${head.title}</title><meta name="description" content="${head.description}">`,
    initialDataScript,
  };
};
