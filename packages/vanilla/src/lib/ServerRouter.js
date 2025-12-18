import { BaseRouter } from "./BaseRouter.js";

export class ServerRouter extends BaseRouter {
  #query = {};

  constructor(baseUrl = "") {
    super(baseUrl);
  }

  /** 현재 쿼리 */
  get query() {
    return this.#query;
  }

  set query(newQuery) {
    this.#query = newQuery;
    // const newUrl = this.getUrl(newQuery, this.baseUrl);
    // this.push(newUrl);
  }

  resolve(url = "") {
    const fullURL = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
    const { pathname, search } = new URL(fullURL, "http://localhost");

    this._setRoute(this.findRoute(pathname));
    this.query = BaseRouter.parseQuery(search);

    return {
      path: this.route?.path || pathname,
      query: this.query,
      params: this.params,
      handler: this.target,
    };
  }
}
