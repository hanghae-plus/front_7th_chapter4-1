import type { FC } from "react";
import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

/**
 * 라우트 정보를 담는 인터페이스
 * - regex: 경로 매칭을 위한 정규식
 * - paramNames: 경로 파라미터 이름 배열 (예: ['id', 'name'])
 * - handler: 해당 라우트의 핸들러 컴포넌트
 * - params: 매칭된 파라미터 값들 (런타임에 설정됨)
 */
interface Route<Handler extends FC> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

/**
 * 클라이언트 환경인지 확인
 * SSR 환경에서는 window가 undefined이므로 이를 이용해 구분
 */
const isClient = typeof window !== "undefined";

/**
 * 쿼리 파라미터의 값 타입
 * 문자열, 숫자, 또는 undefined 가능
 */
type QueryPayload = Record<string, string | number | undefined>;

/**
 * Router 인스턴스 타입
 * 제네릭으로 핸들러 함수 타입을 받음
 */
export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;

/**
 * SPA 라우터 클래스
 *
 * 주요 기능:
 * - 경로 기반 라우팅 (예: /product/:id)
 * - 쿼리 파라미터 처리
 * - 브라우저 히스토리 API 활용
 * - SSR 지원 (서버 사이드에서도 동작)
 * - 옵저버 패턴으로 상태 변경 알림
 *
 * @template Handler - 라우트 핸들러 컴포넌트 타입
 */
export class Router<Handler extends FC> {
  /** 등록된 라우트들을 저장하는 Map (경로 패턴 -> Route 객체) */
  readonly #routes: Map<string, Route<Handler>>;
  /** 옵저버 패턴을 위한 옵저버 인스턴스 (상태 변경 시 구독자에게 알림) */
  readonly #observer = createObserver();
  /** 기본 URL 경로 (예: /front_7th_chapter4-1/react) */
  readonly #baseUrl;
  /** 서버 사이드에서 사용할 쿼리 파라미터 (SSR 환경에서 window.location.search가 없을 때 사용) */
  #serverQuery: StringRecord = {};

  /** 현재 매칭된 라우트 정보 (null이면 매칭된 라우트 없음) */
  #route: null | (Route<Handler> & { params: StringRecord; path: string });

  /**
   * Router 생성자
   *
   * @param initRoutes - 초기 라우트 설정 객체 (예: { "/": HomePage, "/product/:id": ProductDetailPage })
   * @param baseUrl - 기본 URL 경로 (예: "/front_7th_chapter4-1/react")
   */
  constructor(initRoutes: Record<string, Handler>, baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    // baseUrl 끝의 슬래시 제거 (일관성 유지)
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    // 초기 라우트들을 등록
    Object.entries(initRoutes).forEach(([path, page]) => {
      this.addRoute(path, page);
    });

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
        const target = e.target as HTMLElement;
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

  /**
   * 현재 URL의 쿼리 파라미터를 객체로 반환
   * 클라이언트에서는 window.location.search를 파싱하고,
   * 서버에서는 #serverQuery를 반환
   */
  get query(): StringRecord {
    if (typeof window !== "undefined") {
      // 클라이언트: 브라우저의 현재 URL 쿼리 파라미터 파싱
      return Router.parseQuery(window.location.search);
    }
    // 서버: 서버 사이드에서 설정된 쿼리 파라미터 반환
    return this.#serverQuery;
  }

  /**
   * 쿼리 파라미터 설정
   * 클라이언트에서는 URL을 업데이트하고, 서버에서는 내부 상태만 업데이트
   */
  set query(newQuery: QueryPayload) {
    if (isClient) {
      // 클라이언트: 새로운 쿼리로 URL 생성 후 네비게이션
      const newUrl = Router.getUrl(newQuery, this.#baseUrl);
      this.push(newUrl);
    } else {
      // 서버: 빈 값 제거 후 문자열로 변환하여 저장
      this.#serverQuery = Object.entries(newQuery).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          acc[key] = String(value);
          return acc;
        }
        return acc;
      }, {} as StringRecord);
    }
  }

  /**
   * 현재 라우트의 경로 파라미터 반환 (예: /product/:id에서 id 값)
   * 매칭된 라우트가 없으면 빈 객체 반환
   */
  get params() {
    return this.#route?.params ?? {};
  }

  /**
   * 경로 파라미터 설정
   * 라우트가 없으면 빈 라우트 객체 생성 후 파라미터 설정
   */
  set params(newParams: StringRecord) {
    this.#route ??= {} as Route<Handler> & { params: StringRecord; path: string };
    this.#route.params = newParams;
  }

  /**
   * 현재 매칭된 라우트 정보 반환
   */
  get route() {
    return this.#route;
  }

  /**
   * 현재 매칭된 라우트의 핸들러 컴포넌트 반환
   */
  get target() {
    return this.#route?.handler;
  }

  /**
   * 라우터 상태 변경을 구독하는 함수
   * 옵저버 패턴을 통해 라우트 변경 시 구독자에게 알림
   */
  readonly subscribe = this.#observer.subscribe;

  /**
   * 라우트 등록
   *
   * 경로 패턴 예시:
   * - "/" -> 정확히 루트 경로
   * - "/product/:id" -> /product/123 같은 경로 매칭, id 파라미터 추출
   * - "*" -> 모든 경로 매칭 (404 페이지 등에 사용)
   *
   * @param path - 경로 패턴 문자열
   * @param handler - 해당 경로에 매칭될 때 렌더링할 컴포넌트
   */
  addRoute<T>(path: string, handler: FC<T>) {
    // 와일드카드 경로 처리 (모든 경로 매칭)
    if (path === "*") {
      const regex = new RegExp(".*");
      this.#routes.set(path, {
        regex,
        paramNames: [], // 와일드카드는 파라미터 없음
        handler: handler as Handler,
      });
      return;
    }

    // 경로 패턴을 정규식으로 변환
    // 예: "/product/:id" -> "/product/([^/]+)"
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        // :id 같은 파라미터를 ([^/]+) 정규식으로 변환
        // [^/]+ 는 슬래시가 아닌 문자 1개 이상을 의미
        paramNames.push(match.slice(1)); // ':id' -> 'id' (파라미터 이름 저장)
        return "([^/]+)"; // 정규식 그룹으로 변환
      })
      .replace(/\//g, "\\/"); // 슬래시를 이스케이프 (정규식에서 슬래시는 특수문자)

    // 클라이언트에서는 baseUrl을 포함한 정규식 생성
    // 서버에서는 baseUrl 없이 정규식 생성 (서버에서는 이미 baseUrl이 제거된 경로를 받음)
    const regex = isClient ? new RegExp(`^${this.#baseUrl}${regexPath}$`) : new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames, // 추출된 파라미터 이름들 (예: ['id'])
      handler: handler as Handler,
    });
  }

  /**
   * 주어진 URL에 매칭되는 라우트를 찾는 내부 메서드
   *
   * @param url - 매칭할 URL (없으면 현재 경로 사용)
   * @returns 매칭된 라우트 정보 또는 null
   */
  #findRoute(url?: string) {
    // URL에서 pathname 추출
    // url이 주어지면 그것을 사용하고, 없으면 현재 브라우저 경로 또는 "/" 사용
    const pathname = url
      ? new URL(url, "http://localhost").pathname // 상대 URL을 절대 URL로 변환하기 위한 임시 base URL
      : typeof window !== "undefined"
        ? window.location.pathname // 클라이언트: 브라우저의 현재 경로
        : "/"; // 서버: 기본 경로

    // 등록된 모든 라우트를 순회하며 매칭 시도
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매칭 성공: 정규식 그룹에서 파라미터 값 추출
        const params: StringRecord = {};
        route.paramNames.forEach((name, index) => {
          // match[0]은 전체 매칭, match[1]부터는 그룹 매칭
          // 예: "/product/123" 매칭 시 match[1] = "123"
          params[name] = match[index + 1];
        });

        // 매칭된 라우트 정보 반환
        return {
          ...route,
          params, // 추출된 파라미터 값들
          path: routePath, // 원본 경로 패턴
        };
      }
    }
    // 매칭되는 라우트가 없으면 null 반환
    return null;
  }

  /**
   * 새로운 경로로 네비게이션
   * 브라우저 히스토리에 추가하고 라우트를 업데이트함
   *
   * @param url - 이동할 경로
   */
  push(url: string) {
    // 서버 사이드에서는 동작하지 않음
    if (!isClient) return;

    try {
      // baseUrl이 포함되어 있지 않으면 추가
      // 상대 경로인 경우 슬래시 처리
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      // 현재 URL과 비교하여 동일하면 히스토리 업데이트 생략
      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      if (prevFullUrl !== fullUrl) {
        // 브라우저 히스토리에 추가 (페이지 새로고침 없이 URL 변경)
        window.history.pushState(null, "", fullUrl);
      }

      // 새로운 경로에 맞는 라우트 찾기
      this.#route = this.#findRoute(fullUrl);
      // 구독자들에게 라우트 변경 알림
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 초기화 및 시작
   * 주어진 URL로 라우트를 찾고 구독자에게 알림
   *
   * @param url - 초기 경로 (없으면 현재 경로 사용)
   */
  start(url?: string) {
    this.#route = this.#findRoute(url);
    this.#observer.notify();
  }

  /**
   * 쿼리 문자열을 객체로 파싱
   * 예: "?category=electronics&sort=price" -> { category: "electronics", sort: "price" }
   *
   * @param search - 쿼리 문자열 (예: "?key=value")
   * @returns 파싱된 쿼리 객체
   */
  static parseQuery = (search?: string) => {
    const searchString = search || (isClient ? window.location.search : "");
    const params = new URLSearchParams(searchString);
    const query: StringRecord = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  /**
   * 쿼리 객체를 문자열로 변환
   * 빈 값(null, undefined, "")은 제외됨
   * 예: { category: "electronics", sort: "price" } -> "category=electronics&sort=price"
   *
   * @param query - 쿼리 객체
   * @returns 쿼리 문자열
   */
  static stringifyQuery = (query: QueryPayload) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      // 빈 값은 제외
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  /**
   * 새로운 쿼리 파라미터로 URL 생성
   * 현재 쿼리와 병합하여 새로운 URL 반환
   *
   * @param newQuery - 추가/변경할 쿼리 파라미터
   * @param baseUrl - 기본 URL 경로
   * @returns 새로운 URL 문자열
   */
  static getUrl = (newQuery: QueryPayload, baseUrl = "") => {
    // 현재 쿼리 파라미터 가져오기
    const currentQuery = Router.parseQuery();
    // 현재 쿼리와 새 쿼리 병합 (새 쿼리가 우선)
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    // 쿼리 문자열 생성
    const queryString = Router.stringifyQuery(updatedQuery);
    // 현재 pathname 가져오기 (서버에서는 "/")
    const pathname = isClient ? window.location.pathname : "/";
    // baseUrl 제거 후 새로운 URL 생성
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
