// 글로벌 라우터 인스턴스
// src/router/router.js
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";

// 클라이언트용 싱글톤
export const router = new Router(BASE_URL);

// 서버용 (요청마다 새 인스턴스) - base 없이 생성 (server.js에서 이미 base 제거됨)
export const createServerRouter = () => new Router("");

// 라우트 등록 함수 (외부에서 호출)
export const registerRoutes = (routerInstance, routes) => {
  routes.forEach((route) => {
    routerInstance.addRoute(route.path, route);
  });
  return routerInstance;
};
