import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { logger as baseLogger } from "./lib/logger.js";
import { safeSerialize } from "./utils/serialize.js";

const logger = baseLogger.child({
  base: "ROOT_SERVER",
});

export const render = async (url) => {
  const { router } = await import("./router/router");

  router.addRoute("/", HomePage);
  router.addRoute(".*", NotFoundPage);

  const context = router.resolve(url);

  try {
    if (context.path === ".*" || context.path === undefined) {
      throw notFound(context.path, context.query);
    }

    logger.info(`Requested ${context.path}`);

    switch (context.path.trim()) {
      case "/": {
        return {
          head: renderHead("쇼핑몰 - 홈"),
          body: "",
          initialScript: wrappingInitialDataScript({ status: "ok" }),
        };
      }

      default: {
        throw notFound(context.path, context.query);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return {
        head: renderHead("404 Not Found"),
        body: "",
        initialScript: wrappingInitialDataScript({ status: error.message ?? "notFound" }),
      };
    }
  }

  return "";
};

const notFound = (pathname, query) => {
  throw new Error("NOT_FOUND", { cause: { pathname, query } });
};

const renderHead = (title = "쇼핑몰 - 홈") => {
  return `<title>${title}</title>`;
};

const wrappingInitialDataScript = (initialData = {}) => {
  return `<script>window.__INITIAL_DATA__ = ${safeSerialize(initialData)};</script>`;
};
