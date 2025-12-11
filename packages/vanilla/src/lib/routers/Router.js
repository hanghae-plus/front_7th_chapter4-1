import { BaseRouter } from "./BaseRouter.js";

export class Router extends BaseRouter {
  constructor(baseUrl = "") {
    super(baseUrl);

    window.addEventListener("popstate", () => {
      this.setRoute(this.findRoute());
      this.notify();
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target?.closest("[data-link]")) {
        return;
      }
      e.preventDefault();
      const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
      if (url) {
        this.push(url);
      }
    });
  }

  get query() {
    return Router.parseQuery(window.location.search);
  }

  set query(newQuery) {
    const newUrl = this.getUrl(newQuery);
    this.push(newUrl);
  }

  get pathname() {
    return window.location.pathname;
  }

  push(url) {
    try {
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.setRoute(this.findRoute(fullUrl.split("?")[0]));
      this.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  getUrl(newQuery) {
    const currentQuery = this.query;
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    const pathname = this.pathname.replace(this.baseUrl, "");
    return `${this.baseUrl}${pathname}${queryString ? `?${queryString}` : ""}`;
  }
}
