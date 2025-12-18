import { isServer } from "../utils/isServer.js";
import { ClientRouter } from "./ClientRouter.js";
import { ServerRouter } from "./ServerRouter.js";

export class UniversalRouter {
  #router;

  constructor(baseUrl = "") {
    this.#router = isServer() ? new ServerRouter(baseUrl) : new ClientRouter(baseUrl);
  }

  get baseUrl() {
    return this.#router.baseUrl;
  }

  get query() {
    return this.#router.query;
  }

  set query(newQuery) {
    this.#router.query = newQuery;
  }

  get params() {
    return this.#router.params;
  }

  get route() {
    return this.#router.route;
  }

  get target() {
    return this.#router.target;
  }

  subscribe(...args) {
    return this.#router.subscribe?.(...args);
  }

  addRoute(...args) {
    return this.#router.addRoute(...args);
  }

  match(...args) {
    return this.#router.match?.(...args);
  }

  push(...args) {
    return this.#router.push?.(...args);
  }

  start() {
    return this.#router.start?.();
  }
}
