// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { ServerRouter } from "./ServerRouter.js";
import { BASE_URL } from "../constants.js";
import { isServer } from "../utils/ssrUtils.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";

export const router = isServer() ? new ServerRouter({ fallbackHandler: NotFoundPage }) : new Router(BASE_URL);
