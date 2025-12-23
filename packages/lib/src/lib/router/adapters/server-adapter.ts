import type { Runtime } from "../types";

export function createServerRuntime(initialHref = "/"): Runtime {
  let href = initialHref || "/";

  return {
    getHref() {
      return href;
    },
    // server navigation usually doesn't make sense; keep as internal update/noop
    push(nextHref) {
      href = nextHref || href;
    },
    // no popstate on server
    onChange() {
      return () => {};
    },
    // convenience for SSR: update per request
    setHref(nextHref) {
      href = nextHref || href;
    },
  };
}
