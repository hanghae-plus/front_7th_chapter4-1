// 글로벌 클라이언트 라우터 인스턴스
import { ClientRouter } from "../lib";
import { BASE_URL } from "../constants.js";

export const router = new ClientRouter(BASE_URL);
