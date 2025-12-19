// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";
import { isBrowser } from "./ssrContext.js";

export const router = isBrowser() ? new Router(BASE_URL) : null;
