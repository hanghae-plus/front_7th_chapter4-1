// 클라이언트 사이드 exports
export { clientRouter, clientRouter as router } from "./clientRouter.js";
export * from "./withLifecycle.js";

// 서버 사이드 exports (서버 코드에서만 사용)
export { matchRoute, parseQuery } from "./serverRouter.js";
