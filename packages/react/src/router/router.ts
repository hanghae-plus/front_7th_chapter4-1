// 글로벌 라우터 인스턴스
import { Router, MemoryRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";

export const createRouter = () => {
  if (typeof window === "undefined") {
    return new MemoryRouter(BASE_URL);
  } else {
    return new Router(BASE_URL);
  }
};

export const router = createRouter();
