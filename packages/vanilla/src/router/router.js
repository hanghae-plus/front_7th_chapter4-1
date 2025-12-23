// 글로벌 라우터 인스턴스
import { CoreRouter } from "../lib/router/CoreRouter.js";
import { BASE_URL } from "../constants.js";
import { createBrowserRuntime } from "../lib/router/browser-adapter.js";

const runtime = createBrowserRuntime(BASE_URL);
export const router = new CoreRouter(runtime, BASE_URL);
