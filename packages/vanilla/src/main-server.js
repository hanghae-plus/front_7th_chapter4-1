import { CoreRouter } from "./lib/router/CoreRouter";
import { createServerRuntime } from "./lib/router/server-adapter";
import { pageConfigs } from "./pages/page-configs.js";
import NotFoundPage from "./pages/NotFoundPage.js";

export const render = async (url) => {
  const runtime = createServerRuntime(url);
  const router = new CoreRouter(runtime, "");

  Object.entries(pageConfigs).forEach(([route, config]) => {
    router.addRoute(route, config.ssrRender, {
      hydrate: config.hydrate,
      getServerSideProps: config.getServerSideProps,
    });
  });

  router.start();

  const ctx = {
    params: router.params,
    query: router.query,
  };

  const matchedRoute = router.route;
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

  const props = serverSideData.props ?? {};
  const head = serverSideData.head ?? { title: "페이지를 찾을 수 없습니다", description: "404 Not Found" };

  const pageComponent = router.target;
  const html = pageComponent ? pageComponent(props) : "<div>Not Found</div>";

  const initialDataScript = getServerSideProps
    ? `<script>window.__INITIAL_DATA__=${JSON.stringify(props)};window.__HYDRATED__=true;</script>`
    : "";

  return {
    html,
    head: `<title>${head.title}</title><meta name="description" content="${head.description}">`,
    initialDataScript,
  };
};
