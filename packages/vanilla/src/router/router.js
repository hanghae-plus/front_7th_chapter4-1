// 글로벌 라우터 인스턴스
import { BASE_URL } from "../constants.js";
import { ClientRouter, ServerRouter } from "../lib/index.js";

export const router = typeof window === "undefined" ? new ServerRouter(BASE_URL) : new ClientRouter(BASE_URL);
