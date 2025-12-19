import type { FunctionComponent } from "react";
import { HomePage, ProductDetailPage, NotFoundPage } from "../pages";

export interface RouteMatch {
  component: FunctionComponent;
  params: Record<string, string>;
}

interface Route {
  path: string;
  pattern: RegExp;
  paramNames: string[];
  component: FunctionComponent;
}

/**
 * 서버 전용 라우터
 * - window 이벤트 없이 URL 매칭만 수행
 * - SSR/SSG 환경에서 안전하게 사용 가능
 */
export class ServerRouter {
  private routes: Route[] = [];

  /**
   * 라우트 등록
   * @param path - URL 패턴 (예: "/product/:id/")
   * @param component - 해당 라우트의 React 컴포넌트
   */
  addRoute(path: string, component: FunctionComponent): void {
    const { pattern, paramNames } = this.pathToRegex(path);
    this.routes.push({ path, pattern, paramNames, component });
  }

  /**
   * URL 경로를 정규식으로 변환
   * @param path - URL 패턴 (예: "/product/:id/")
   * @returns 정규식과 파라미터 이름 배열
   */
  private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];

    // :paramName 형태를 정규식 그룹으로 변환
    const regexPattern = path
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // 특수문자 이스케이프
      .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
      });

    // 끝에 선택적 슬래시 허용
    const finalPattern = `^${regexPattern}$`.replace(/\\\/$/, "\\/?$");

    return {
      pattern: new RegExp(finalPattern),
      paramNames,
    };
  }

  /**
   * URL과 매칭되는 라우트 찾기
   * @param url - 요청 URL (쿼리스트링 포함 가능)
   * @returns 매칭된 라우트 정보 또는 null
   */
  findRoute(url: string): RouteMatch | null {
    // 쿼리스트링 제거
    const pathname = url.split("?")[0];

    for (const route of this.routes) {
      const match = pathname.match(route.pattern);

      if (match) {
        const params: Record<string, string> = {};

        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          component: route.component,
          params,
        };
      }
    }

    return null;
  }

  /**
   * 404 페이지 컴포넌트 반환
   */
  getNotFoundComponent(): FunctionComponent {
    return NotFoundPage;
  }
}

// 서버 라우터 인스턴스 생성 및 라우트 등록
export const serverRouter = new ServerRouter();
serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id/", ProductDetailPage);
