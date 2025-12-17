const createServerRouter = () => {
  const routes = [];

  const addRoute = (path, handler) => {
    const paramNames = [];

    // :id → (\d+) 정규식 변환
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ":id" → "id"
        return "(\\d+)"; // 숫자만 매칭
      })
      .replace(/\//g, "\\/"); // "/" → "\/"

    const regex = new RegExp(`^${regexPath}$`);

    routes.push({ path, regex, paramNames, handler });
  };

  const findRoute = (url) => {
    // URL에서 pathname만 추출 (query는 Express에서 처리)
    const pathname = url.split("?")[0];

    for (const route of routes) {
      const match = pathname.match(route.regex);

      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { route, params };
      }
    }

    return null;
  };

  return { addRoute, findRoute };
};

// TODO: 데이터 프리페칭

export async function render(url, query = {}) {
  const router = createServerRouter();

  router.addRoute("/", () => "<div>홈페이지</div>");
  router.addRoute("/product/:id/", () => "<div>상품 상세</div>");

  const routeInfo = router.findRoute(url);

  if (!routeInfo) {
    return {
      html: "<div>404 Not Found</div>",
      head: "<title>404 - Not Found</title>",
      initialDataScript: "",
    };
  }

  const { params } = routeInfo;
  const html = routeInfo.route.handler();
  const head = "<title>쇼핑몰</title>";

  const initialData = { params, query };

  const initialDataScript = `
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
    </script>
  `;

  return { html, head, initialDataScript };
}
