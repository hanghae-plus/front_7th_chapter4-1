export let ssrContext = null;

export const setSSRContext = (ctx) => {
  ssrContext = ctx;
};

/**
 * SSR 렌더링 컨텍스트 중인지 확인
 * - setSSRContext() 호출 후에만 true
 * - 렌더링 라이프사이클 체크에 사용
 */
export const isSSR = () => ssrContext !== null;

/**
 * 서버(Node.js) 환경인지 확인
 * - 항상 일정한 결과 반환
 * - 환경 감지, 초기화 로직에 사용
 */
export const isServer = () => typeof window === "undefined";

/**
 * 브라우저 환경인지 확인
 */
export const isBrowser = () => typeof window !== "undefined";

/**
 * SSR 컨텍스트에서 프리페치된 데이터 가져오기
 * @returns {Object|null} SSR 데이터 또는 null
 */
export const getSSRData = () => {
  return ssrContext?.data ?? null;
};
