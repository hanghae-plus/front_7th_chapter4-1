/**
 * ServerRouter - Node.js 환경 전용 라우터
 * SSR을 위한 순수 라우트 매칭 기능 제공
 */
import { BaseRouter } from "./BaseRouter.js";

export class ServerRouter extends BaseRouter {
  constructor(baseUrl = "") {
    super(baseUrl);
  }

  /**
   * URL과 쿼리를 라우트와 매칭
   * @param {string} url - 매칭할 URL 경로
   * @param {Object} query - 쿼리 파라미터 객체
   * @returns {Object} 매칭 결과
   * @returns {string|null} return.route - 매칭된 라우트 패턴
   * @returns {Object} return.params - URL 파라미터 (예: { id: "123" })
   * @returns {Object} return.query - 쿼리 파라미터
   * @returns {Function|null} return.handler - 라우트 핸들러 함수
   * @returns {boolean} return.matched - 매칭 성공 여부
   */
  match(url, query = {}) {
    const route = this.findRoute(url);

    // 내부 상태 업데이트 (target getter 호환성)
    this._setRoute(route);

    return {
      route: route?.path || null,
      params: route?.params || {},
      query: query,
      handler: route?.handler || null,
      matched: route !== null,
    };
  }

  /**
   * 현재 매칭된 라우트 가져오기
   * @returns {Object|null} 현재 라우트 또는 null
   */
  getCurrentRoute() {
    return this.route;
  }

  /**
   * URL 문자열에서 쿼리 파라미터 추출
   * @param {string} url - 쿼리를 포함한 전체 URL
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQueryFromUrl(url) {
    try {
      const urlObj = new URL(url, "http://localhost");
      return BaseRouter.parseQuery(urlObj.search);
    } catch {
      // URL 파싱 실패 시 쿼리 문자열만 추출
      const queryStart = url.indexOf("?");
      if (queryStart === -1) return {};
      return BaseRouter.parseQuery(url.substring(queryStart));
    }
  }
}
