// 글로벌 라우터 인스턴스
// CSR에서만 사용됨 - SSR에서는 ServerRouter와 SSR Context 사용
import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import { isBrowser } from "./ssrContext";
import type { FunctionComponent } from "react";

/**
 * CSR 전용 라우터 인스턴스
 * - 브라우저 환경에서만 생성
 * - 서버 환경에서는 null (SSR에서는 ServerRouter 사용)
 */
export const router: Router<FunctionComponent> | null = isBrowser() ? new Router<FunctionComponent>(BASE_URL) : null;

/**
 * 라우터 인스턴스 가져오기 (안전한 접근)
 * - 브라우저 환경에서만 사용 가능
 * - SSR에서 호출하면 에러 발생
 */
export const getRouter = (): Router<FunctionComponent> => {
  if (!router) {
    throw new Error("Router can only be used in browser environment. Use ServerRouter for SSR.");
  }
  return router;
};
