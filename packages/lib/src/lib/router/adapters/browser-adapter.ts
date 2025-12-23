import type { Runtime } from "../types";
import { browserPlatform } from "../../platform";

const platform = browserPlatform;

export function createBrowserRuntime(baseUrl = ""): Runtime {
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

    setupClickHandler(cb: (url: string) => void) {
      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target?.closest("[data-link]")) {
          return;
        }
        e.preventDefault();
        const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
        if (url) {
          cb(url);
        }
      });
    },
  };
}
