/**
 * 서버 사이드 라우터
 * - 클라이언트 Router와 달리 window 객체를 사용하지 않음
 * - URL을 파라미터로 받아서 라우트 매칭만 수행
 *
 * 참고: /packages/vanilla/src/router/serverRouter.js
 * 참고: /packages/lib/src/Router.ts
 */
import type { FunctionComponent } from "react";

interface Route {
  regex: RegExp;
  paramNames: string[];
  handler: FunctionComponent;
}

interface MatchedRoute {
  handler: FunctionComponent;
  params: Record<string, string>;
  path: string;
}

export class ServerRouter {
  #routes = new Map<string, Route>();
  #baseUrl: string;

  constructor(baseUrl = "") {
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * 라우트 등록
   * @param path - 경로 패턴 (예: "/product/:id/")
   * @param handler - 페이지 컴포넌트
   */
  addRoute(path: string, handler: FunctionComponent): void {
    const paramNames: string[] = [];

    // :param을 정규식으로 변환
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);
    this.#routes.set(path, { regex, paramNames, handler });
  }

  /**
   * URL 매칭
   * @param url - 매칭할 URL (예: "/product/123/")
   * @returns 매칭된 라우트 정보 또는 null
   */
  match(url: string): MatchedRoute | null {
    // 쿼리스트링 제거
    const pathname = url.split("?")[0];

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);

      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { handler: route.handler, params, path: routePath };
      }
    }

    return null;
  }
}
