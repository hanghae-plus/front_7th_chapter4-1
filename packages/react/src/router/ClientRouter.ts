import { BaseRouter, type QueryPayload } from "./BaseRouter";
import type { StringRecord } from "../types";

/**
 * 클라이언트 사이드 라우터
 * 브라우저 환경에서 History API를 사용하여 SPA 라우팅 제공
 */
export class ClientRouter<Handler extends (...args: never[]) => unknown> extends BaseRouter<Handler> {
  private listeners: Set<() => void>;

  constructor(baseUrl = "") {
    super(baseUrl);
    this.listeners = new Set();

    // 뒤로가기/앞으로가기 감지
    window.addEventListener("popstate", () => {
      this.route = this.findRoute();
      this.notify();
    });
  }

  /**
   * pathname을 가져오는 메서드 (override)
   * @protected
   */
  protected getPathname(url: string = window.location.pathname): string {
    const { pathname } = new URL(url, window.location.origin);
    return pathname;
  }

  /**
   * 현재 URL의 쿼리 파라미터를 반환
   */
  get query(): StringRecord {
    return ClientRouter.parseQuery(window.location.search);
  }

  /**
   * 쿼리 파라미터를 설정하고 네비게이션 실행
   */
  set query(newQuery: QueryPayload) {
    const newUrl = ClientRouter.getUrl(newQuery, this.baseUrl);
    this.push(newUrl);
  }

  /**
   * 라우터 상태 변경 구독
   * @param fn - 라우터 변경 시 실행할 콜백
   */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * 네비게이션 실행
   * @param url - 이동할 경로
   */
  push(url: string): void {
    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.route = this.findRoute(fullUrl);
      this.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 현재 경로 대체
   * @param url - 이동할 경로
   */
  replace(url: string): void {
    try {
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
      window.history.replaceState(null, "", fullUrl);
      this.route = this.findRoute(fullUrl);
      this.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 뒤로 가기
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * 라우터 시작
   */
  start(): void {
    this.route = this.findRoute();
    this.notify();
  }

  /**
   * 쿼리 객체를 URL로 변환
   * @param newQuery - 새로운 쿼리 객체
   * @param baseUrl - 베이스 URL
   * @returns 완성된 URL
   */
  static getUrl(newQuery: QueryPayload, baseUrl = ""): string {
    const currentQuery = ClientRouter.parseQuery(window.location.search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ClientRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  }
}
