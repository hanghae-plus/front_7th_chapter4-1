// 글로벌 라우터 인스턴스
import { UniversalRouter } from "../lib";
import { BASE_URL } from "../constants.js";

export const router = new UniversalRouter(BASE_URL);
