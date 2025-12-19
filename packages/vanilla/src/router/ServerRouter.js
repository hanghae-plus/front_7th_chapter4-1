export class ServerRouter {
  constructor({ fallbackHandler }) {
    this.route = null;
    this.query = {};
    this.routes = new Map();
    this.paramNames = [];
    this.fallbackRoute = { handler: fallbackHandler, params: {} };
  }

  get params() {
    return this.route?.params ?? {};
  }

  get target() {
    return this.route?.handler;
  }

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path.replace(":id", () => {
      paramNames.push("id");
      return "(\\d+)";
    });

    this.routes.set(`^${regexPath}(/|)$`, { path, handler, paramNames });
  }

  findRoute(url) {
    const { pathname } = new URL(url, "http://localhost");

    for (const [path, route] of this.routes) {
      const match = pathname.match(path);

      if (match) {
        const params = route.paramNames.reduce((acc, name, index) => {
          return { ...acc, [name]: match[index + 1] };
        }, {});

        return { handler: route.handler, params, path: route.path };
      }
    }

    return this.fallbackRoute;
  }
}
