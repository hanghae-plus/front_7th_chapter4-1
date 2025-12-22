import { CoreRouter } from "./lib/router/CoreRouter";
import { createServerRuntime } from "./lib/router/server-adapter";
import { pageConfigs } from "./pages/page-configs.js";

export const render = async (url) => {
  console.log("[render]", { url });
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

  const serverSideData = await getServerSideProps(ctx);
  const props = serverSideData.props ?? {};
  const head = serverSideData.head ?? { title: "Not Found", description: "" };

  const pageComponent = router.target;
  const html = pageComponent ? pageComponent(props) : "<div>Not Found</div>";

  const initialDataScript = `<script>window.__INITIAL_DATA__=${JSON.stringify(props)};window.__HYDRATED__=true;</script>`;

  return {
    html,
    head: `<title>${head.title}</title><meta name="description" content="${head.description}">`,
    initialDataScript,
  };
};
