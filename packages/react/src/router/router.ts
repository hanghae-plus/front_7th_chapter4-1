// 글로벌 라우터 인스턴스
import { Router, MemoryRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";

export const createRouter = () => {
  if (typeof window === "undefined") {
    // SSR에서는 base 없이 순수 경로만 사용 (server.js에서 이미 base 제거됨)
    return new MemoryRouter("");
  } else {
    return new Router(BASE_URL);
  }
};

export const router = createRouter();
