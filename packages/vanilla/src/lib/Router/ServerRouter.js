/**
 * 서버용 라우터 (읽기 전용)
 */

import { BaseRouter } from "./BaseRouter";

export class ServerRouter extends BaseRouter {
  #currentUrl;

  constructor(baseUrl = "", url = "") {
    super(baseUrl);
    this.#currentUrl = url;
  }

  setUrl(url) {
    this.#currentUrl = url;
  }

  get query() {
    const queryString = this.#currentUrl.split("?")[1] || "";
    return queryString ? ServerRouter.parseQuery(`?${queryString}`) : {};
  }

  _getPathname() {
    return this.#currentUrl ? this.#currentUrl.split("?")[0] : "";
  }
}
