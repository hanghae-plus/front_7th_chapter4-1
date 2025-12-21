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
      const path = window.location.pathname + window.location.search;
      if (!base) return path;
      // If app is served under base (e.g. /app), pathname already includes it.
      return path;
    },
    push(href) {
      const next = href;
      const prev = window.location.pathname + window.location.search;
      if (prev !== next) window.history.pushState(null, "", next);
    },
    onChange(cb) {
      const handler = () => cb();
      window.addEventListener("popstate", handler);
      return () => window.removeEventListener("popstate", handler);
    },
  };
}
