import { router } from "./router.js";
import { ssrContext, isBrowser } from "./ssrContext.js";

export const getQuery = () => {
  if (ssrContext) {
    return ssrContext.query ?? {};
  }
  return router?.query ?? {};
};

export const setQuery = (newQuery) => {
  if (ssrContext || !router) return;
  router.query = newQuery;
};

export const getPathname = () => {
  if (ssrContext) {
    return ssrContext.url ?? "/";
  }
  if (isBrowser()) {
    return window.location.pathname;
  }
  return "/";
};

export const getParams = () => {
  if (ssrContext) {
    return ssrContext.params ?? {};
  }
  return router?.params ?? {};
};
