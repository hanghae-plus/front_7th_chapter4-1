export class ServerRouter {
  // 등록된 라우트들 저장
  #routes = [];

  addRoute(path, handler) {
    const paramNames = [];

    const regexPath = path
      .replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name);
        return "(\\d+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.push({ path, regex, paramNames, handler });
  }

  findRoute(url) {
    const pathname = url.split("?")[0];

    for (const route of this.#routes) {
      const match = pathname.match(route.regex);

      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { handler: route.handler, params };
      }
    }

    return null;
  }
}
