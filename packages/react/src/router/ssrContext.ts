import type { Product, Categories } from "../entities/products/types";

export interface SSRData {
  products?: Product[];
  categories?: Categories;
  totalCount?: number;
  product?: Product;
  relatedProducts?: Product[];
}

export interface SSRContext {
  url: string;
  query: Record<string, string>;
  params: Record<string, string>;
  data: SSRData | null;
}

let ssrContext: SSRContext | null = null;

export const setSSRContext = (ctx: SSRContext | null): void => {
  ssrContext = ctx;
};

/**
 * SSR 렌더링 컨텍스트 중인지 확인
 * - setSSRContext() 호출 후에만 true
 * - 렌더링 라이프사이클 체크에 사용
 */
export const isSSR = (): boolean => ssrContext !== null;

/**
 * 서버(Node.js) 환경인지 확인
 * - 항상 일정한 결과 반환
 * - 환경 감지, 초기화 로직에 사용
 */
export const isServer = (): boolean => typeof window === "undefined";

/**
 * 브라우저 환경인지 확인
 */
export const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * SSR 컨텍스트에서 프리페치된 데이터 가져오기
 */
export const getSSRData = (): SSRData | null => {
  return ssrContext?.data ?? null;
};

/**
 * SSR 컨텍스트에서 URL 파라미터 가져오기
 */
export const getSSRParams = (): Record<string, string> => {
  return ssrContext?.params ?? {};
};

/**
 * SSR 컨텍스트에서 쿼리스트링 가져오기
 */
export const getSSRQuery = (): Record<string, string> => {
  return ssrContext?.query ?? {};
};
