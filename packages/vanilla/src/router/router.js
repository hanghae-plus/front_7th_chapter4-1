// 글로벌 라우터 인스턴스
import { Router, ServerRouter } from "../lib";
import { BASE_URL } from "../constants.js";
import { isServer } from "../utils/envUtils.js";

// 서버 환경에서는 ServerRouter, 클라이언트에서는 Router
export const router = isServer() ? new ServerRouter(BASE_URL) : new Router(BASE_URL);
