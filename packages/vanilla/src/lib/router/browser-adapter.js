import { platform } from "../platform";

/**
 * Browser runtime adapter
 * - getHref(): "/path?query"
 * - push(href): history.pushState + (does NOT trigger popstate)
 * - onChange(cb): listen popstate
 */
export function createBrowserRuntime(baseUrl = "") {
  const base = (baseUrl || "").replace(/\/$/, "");

  return {
    getHref() {
      // include baseUrl if configured (so router.push can compare apples-to-apples)
      const path = platform.location.pathname + platform.location.search;
      if (!base) return path;
      // If app is served under base (e.g. /app), pathname already includes it.
      return path;
    },
    push(href) {
      const next = href;
      const prev = platform.location.pathname + platform.location.search;
      if (prev !== next) platform.history.pushState(null, "", next);
    },
    onChange(cb) {
      const handler = () => cb();
      platform.addEventListener("popstate", handler);
      return () => platform.removeEventListener("popstate", handler);
    },
  };
}
