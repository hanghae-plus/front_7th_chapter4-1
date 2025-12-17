import { Router, ServerRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

/**
 * Universal Router: 환경에 따라 적절한 라우터 인스턴스 생성
 * CRITICAL: 환경 분기는 모듈 레벨에서 한 번만 수행 (컴포넌트 내부 X)
 *
 * - 서버: ServerRouter (window 의존성 없음, 순수 URL 매칭)
 * - 클라이언트: Router (window.history API 사용, pushState 지원)
 */
export const router =
  typeof window === "undefined"
    ? new ServerRouter<FunctionComponent>(BASE_URL)
    : new Router<FunctionComponent>(BASE_URL);

export type RouterInstance = typeof router;
