import { BaseRouter } from "./BaseRouter";
import type { StringRecord } from "../types";

/**
 * 서버 사이드 라우터 (읽기 전용)
 * SSR 환경에서 사용되며 window 객체에 의존하지 않음
 */
export class ServerRouter<Handler extends (...args: never[]) => unknown> extends BaseRouter<Handler> {
  private currentUrl: string;

  constructor(baseUrl = "", url = "") {
    super(baseUrl);
    this.currentUrl = url;
  }

  /**
   * 현재 URL 설정
   * @param url - 설정할 URL
   */
  setUrl(url: string): void {
    this.currentUrl = url;
  }

  /**
   * 현재 URL의 쿼리 파라미터를 반환
   */
  get query(): StringRecord {
    const queryString = this.currentUrl.split("?")[1] || "";
    return queryString ? ServerRouter.parseQuery(`?${queryString}`) : {};
  }

  /**
   * pathname을 가져오는 메서드 (override)
   * @protected
   */
  protected getPathname(): string {
    return this.currentUrl ? this.currentUrl.split("?")[0] : "";
  }
}
