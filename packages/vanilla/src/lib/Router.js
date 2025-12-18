/**
 * 간단한 SPA 라우터
 *
 * 주요 기능:
 * - 경로 기반 라우팅 (예: /product/:id)
 * - 쿼리 파라미터 처리
 * - 브라우저 히스토리 API 활용
 * - SSR 지원 (서버 사이드에서도 동작)
 * - 옵저버 패턴으로 상태 변경 알림
 */
import { createObserver } from "./createObserver.js";

/**
 * 클라이언트 환경인지 확인
 * SSR 환경에서는 window가 undefined이므로 이를 이용해 구분
 */
const isClient = typeof window !== "undefined";

/**
 * SPA 라우터 클래스
 *
 * 경로 패턴 예시:
 * - "/" -> 정확히 루트 경로
 * - "/product/:id" -> /product/123 같은 경로 매칭, id 파라미터 추출
 * - "*" -> 모든 경로 매칭 (404 페이지 등에 사용)
 */
export class Router {
  /** 등록된 라우트들을 저장하는 Map (경로 패턴 -> Route 객체) */
  #routes;
  /** 현재 매칭된 라우트 정보 (null이면 매칭된 라우트 없음) */
  #route;
  /** 옵저버 패턴을 위한 옵저버 인스턴스 (상태 변경 시 구독자에게 알림) */
  #observer = createObserver();
  /** 기본 URL 경로 (예: /front_7th_chapter4-1/vanilla) */
  #baseUrl;
  /** 404 핸들러 (매칭되는 라우트가 없을 때 사용) */
  #notFoundHandler;
  /** 서버 사이드에서 사용할 쿼리 파라미터 (SSR 환경에서 window.location.search가 없을 때 사용) */
  #serverQuery = {};

  /**
   * Router 생성자
   *
   * @param {Object|null} routes - 초기 라우트 설정 객체 (예: { "/": HomePage, "/product/:id": ProductDetailPage })
   * @param {string} baseUrl - 기본 URL 경로 (예: "/front_7th_chapter4-1/vanilla")
   */
  constructor(routes = null, baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    // baseUrl 끝의 슬래시 제거 (일관성 유지)
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#notFoundHandler = null;

    // 초기 라우트들을 등록
    if (routes) {
      this.addRoutes(routes);
    }

    // 클라이언트 환경에서만 이벤트 리스너 등록
    if (isClient) {
      // 브라우저 뒤로가기/앞으로가기 버튼 처리
      // popstate 이벤트는 history.pushState/popState로 인한 URL 변경 시 발생
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify(); // 구독자들에게 라우트 변경 알림
      });

      // data-link 속성을 가진 링크 클릭 시 라우터 네비게이션 처리
      // 기본 링크 동작(페이지 새로고침)을 막고 SPA 네비게이션으로 처리
      document.addEventListener("click", (e) => {
        const target = e.target;
        // data-link 속성을 가진 요소 또는 그 자식 요소인지 확인
        if (!target?.closest("[data-link]")) {
          return;
        }
        e.preventDefault(); // 기본 링크 동작 방지
        // href 속성에서 URL 추출 (직접 클릭한 요소 또는 가장 가까운 data-link 요소)
        const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
        if (url) {
          this.push(url); // 라우터를 통해 네비게이션
        }
      });
    }
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    if (isClient) {
      return Router.parseQuery(window.location.search);
    }
    return this.#serverQuery;
  }

  set query(newQuery) {
    if (isClient) {
      const newUrl = Router.getUrl(newQuery, this.#baseUrl);
      this.push(newUrl);
    } else {
      this.#serverQuery = Object.entries(newQuery).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          acc[key] = String(value);
          return acc;
        }
        return acc;
      }, {});
    }
  }

  get params() {
    return this.#route?.params ?? {};
  }

  set params(newParams) {
    if (!this.#route) {
      this.#route = { params: {}, path: "" };
    }
    this.#route.params = newParams;
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * routes 객체를 한 번에 등록
   * @param {Object} routes - 라우트 객체 { "/path": handler, "/product/:id": handler, "*": notFoundHandler }
   */
  addRoutes(routes) {
    for (const [path, handler] of Object.entries(routes)) {
      if (path === "*") {
        this.#notFoundHandler = handler;
      } else {
        this.addRoute(path, handler);
      }
    }
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // * 경로 처리 (와일드카드)
    if (path === "*") {
      const regex = new RegExp(".*");
      this.#routes.set(path, {
        regex,
        paramNames: [],
        handler,
      });
      return;
    }

    // 경로 패턴을 정규식으로 변환
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // BASE_URL을 포함한 정규식 생성 (클라이언트만)
    const baseUrlEscaped = this.#baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = isClient ? new RegExp(`^${baseUrlEscaped}${regexPath}$`) : new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute(url) {
    const pathname = url ? new URL(url, "http://localhost").pathname : isClient ? window.location.pathname : "/";

    // 라우트를 순회하며 매칭 시도 (.* 는 마지막에 확인)
    const catchAllRoute = Array.from(this.#routes.entries()).find(([path]) => path === ".*");
    const otherRoutes = Array.from(this.#routes.entries()).filter(([path]) => path !== ".*");

    // 일반 라우트 먼저 확인
    for (const [routePath, route] of otherRoutes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }

    // catch-all 라우트 확인
    if (catchAllRoute) {
      const [routePath, route] = catchAllRoute;
      return {
        ...route,
        params: {},
        path: routePath,
      };
    }

    if (this.#notFoundHandler) {
      return {
        handler: this.#notFoundHandler,
        params: {},
        path: "*",
        regex: null,
        paramNames: [],
      };
    }

    return null;
  }

  /**
   * 네비게이션 실행
   * @param {string} url - 이동할 경로
   */
  push(url) {
    if (!isClient) return;

    try {
      // baseUrl이 없으면 자동으로 붙여줌
      let fullUrl = url;

      // 절대 경로인 경우 (http://, https://, // 로 시작하는 경우)
      if (url.match(/^(https?:)?\/\//)) {
        // 외부 URL은 그대로 사용
        fullUrl = url;
      } else {
        // 상대 경로인 경우 BASE_URL 처리
        fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);
      }

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작
   */
  start(url) {
    this.#route = this.#findRoute(url);
    if (isClient) {
      this.#observer.notify();
    }
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search) => {
    const searchString = search || (isClient ? window.location.search : "");
    const params = new URLSearchParams(searchString);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery = (query) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery, baseUrl = "") => {
    const currentQuery = Router.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    const pathname = isClient ? window.location.pathname : "/";
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
