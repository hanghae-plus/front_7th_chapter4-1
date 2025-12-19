// 클라이언트 사이드 라우터 인스턴스
import { Router } from "../lib/index.js";
import { BASE_URL } from "../constants.js";

export const clientRouter = new Router(BASE_URL);
