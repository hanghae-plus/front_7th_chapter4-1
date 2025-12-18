// 환경 구분 상수
export const isClient = typeof window !== "undefined";

export const isServer = !isClient;

// 애플리케이션 기본 설정
// import.meta.env는 Vite가 제공하는 환경 변수 (Node.js 직접 실행 시에는 undefined)
export const BASE_URL =
  typeof import.meta !== "undefined" && import.meta.env?.PROD ? "/front_7th_chapter4-1/vanilla/" : "/";

// 빌드 디렉토리 경로 상수
/**
 * 로컬 빌드 디렉토리 (패키지 내부)
 * 클라이언트 빌드 결과물이 저장되는 경로
 */
export const DIST_CLIENT_DIR = "./dist/vanilla";

/**
 * SSG용 빌드 디렉토리 (루트 레벨)
 * 정적 사이트 생성 시 루트의 dist 폴더에 빌드됨
 */
export const DIST_SSG_DIR = "../../dist/vanilla";

/**
 * SSR 서버 빌드 디렉토리
 * 서버 사이드 렌더링용 빌드 결과물이 저장되는 경로
 */
export const DIST_SSR_DIR = "./dist/vanilla-ssr";
