import { BaseRouter } from "./BaseRouter";

export class MemoryRouter extends BaseRouter {
  #currentUrl;

  constructor(baseUrl = "") {
    super(baseUrl);
    this.#currentUrl = "/";
  }

  get query() {
    const [, search] = this.#currentUrl.split("?");
    return MemoryRouter.parseQuery(search ? `?${search}` : "");
  }

  set query(newQuery) {
    const newUrl = this.buildUrl(newQuery);
    this.push(newUrl);
  }

  get pathname() {
    return this.#currentUrl.split("?")[0];
  }

  get currentUrl() {
    return this.#currentUrl;
  }

  push(url) {
    this.#currentUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
    this.setRoute(this.findRoute(this.pathname));
    this.notify();
  }

  buildUrl(newQuery) {
    const currentQuery = this.query;
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = MemoryRouter.stringifyQuery(updatedQuery);
    const pathname = this.pathname.replace(this.baseUrl, "");
    return `${this.baseUrl}${pathname}${queryString ? `?${queryString}` : ""}`;
  }
}
