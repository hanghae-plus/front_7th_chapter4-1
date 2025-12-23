import { CoreRouter } from "./lib/router/CoreRouter";
import { createServerRuntime } from "./lib/router/server-adapter";
import { pageConfigs } from "./pages/page-configs.js";
import NotFoundPage from "./pages/NotFoundPage.js";

export const render = async (url) => {
  const runtime = createServerRuntime(url);
  const ssrRouter = new CoreRouter(runtime, "");

  Object.entries(pageConfigs).forEach(([route, config]) => {
    ssrRouter.addRoute(route, config.ssrRender, {
      hydrate: config.hydrate,
      getServerSideProps: config.getServerSideProps,
      initializeStoreFromSSR: config.initializeStoreFromSSR,
    });
  });

  ssrRouter.start();

  const ctx = {
    params: ssrRouter.params,
    query: ssrRouter.query,
  };

  const matchedRoute = ssrRouter.route;
  const getServerSideProps = matchedRoute?.meta?.getServerSideProps;

  const serverSideData = getServerSideProps ? await getServerSideProps(ctx) : { props: {}, head: null };

  if (serverSideData.notFound) {
    return {
      html: NotFoundPage.ssrRender(),
      head: `<title>페이지를 찾을 수 없습니다</title><meta name="description" content="404 Not Found">`,
      initialDataScript: "",
      statusCode: 404,
    };
  }

  const initializeStoreFromSSR = matchedRoute?.meta?.initializeStoreFromSSR;
  if (initializeStoreFromSSR) {
    await initializeStoreFromSSR(serverSideData.props);
  }

  const props = serverSideData.props ?? {};
  const head = serverSideData.head ?? { title: "페이지를 찾을 수 없습니다", description: "404 Not Found" };

  const pageComponent = ssrRouter.target;
  const html = pageComponent ? pageComponent(props, ssrRouter) : "<div>Not Found</div>";

  const initialDataScript = getServerSideProps
    ? `<script>window.__INITIAL_DATA__=${JSON.stringify(props)};window.__HYDRATED__=true;</script>`
    : "";

  return {
    html,
    head: `<title>${head.title}</title><meta name="description" content="${head.description}">`,
    initialDataScript,
  };
};
