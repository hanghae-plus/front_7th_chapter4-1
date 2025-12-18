/**
 * SSR 관련 유틸리티 함수
 */

import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";

/**
 * SSR 렌더링 결과 타입
 */
export interface SSRPageData {
  /** head 섹션에 들어갈 HTML */
  head?: string;
  /** body에 들어갈 HTML */
  html?: string;
  /** 클라이언트 하이드레이션용 초기 데이터 */
  __INITIAL_DATA__?: unknown;
}

/**
 * HTML 템플릿에 SSR 렌더링 결과를 주입하는 함수
 *
 * @param {string} template - HTML 템플릿 문자열
 * @param {Object} pageData - 페이지 데이터 객체
 * @param {string} [pageData.head] - head 섹션에 들어갈 HTML
 * @param {string} [pageData.html] - body에 들어갈 HTML
 * @param {any} [pageData.__INITIAL_DATA__] - 클라이언트 하이드레이션용 초기 데이터
 * @returns {string} 주입된 HTML 문자열
 */
export const buildHtmlContent = (template: string, pageData: SSRPageData): string => {
  const initialData = JSON.stringify(pageData.__INITIAL_DATA__ || {});
  const initialDataScript = `<script>window.__INITIAL_DATA__ = ${initialData};</script>`;

  return template
    .replace("<!--app-head-->", pageData.head || "")
    .replace("<!--app-html-->", pageData.html || "")
    .replace("<!-- app-data -->", initialDataScript);
};

/**
 * SSR용 Vite 서버를 생성하는 함수
 *
 * @param {Object} options - Vite 서버 옵션
 * @param {string} [options.base] - 기본 URL 경로 (SSR 서버용, SSG에서는 생략)
 * @returns {Promise<import('vite').ViteDevServer>} Vite 개발 서버 인스턴스
 */
export const createViteServer = async (options = {}) => {
  const { base } = options;

  return await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    ...(base && { base }),
  });
};

/**
 * SSG용 출력 경로를 생성하는 함수
 *
 * @param {string} route - 라우트 경로 (예: "/", "/product/123/", "/404.html")
 * @param {string} distDir - 빌드 디렉토리 경로
 * @returns {string} 출력 파일 경로
 */
export const createOutputPath = (route: string, distDir: string): string => {
  // .html로 끝나는 경로는 그대로 사용
  if (route.endsWith(".html")) {
    return path.join(distDir, route);
  }
  // 그 외의 경로는 경로/index.html 형태로 변환
  return path.join(distDir, route, "index.html");
};

/**
 * 디렉토리가 존재하지 않으면 생성하는 함수
 *
 * @param {string} filePath - 파일 경로
 */
export const ensureDirectoryExists = (filePath: string): void => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * SSG 페이지를 생성하는 함수
 *
 * @param {string} route - 라우트 경로
 * @param {Function} renderFn - SSR 렌더링 함수
 * @param {string} template - HTML 템플릿
 * @param {string} distDir - 빌드 디렉토리 경로
 */
export const generatePage = async (
  route: string,
  renderFn: (route: string, query: Record<string, string>) => Promise<SSRPageData>,
  template: string,
  distDir: string,
): Promise<void> => {
  const pageData = await renderFn(route, {});
  const htmlContent = buildHtmlContent(template, pageData);
  const outputPath = createOutputPath(route, distDir);

  ensureDirectoryExists(outputPath);
  fs.writeFileSync(outputPath, htmlContent);
};

/**
 * URL에서 pathname을 추출하고 정규화하는 함수
 *
 * @param {string} originalUrl - 원본 URL (예: "/front_7th_chapter4-1/react/?category=electronics")
 * @param {string} base - 기본 URL 경로 (예: "/front_7th_chapter4-1/react/")
 * @returns {string} 정규화된 pathname (예: "/")
 */
export const extractPathname = (originalUrl: string, base: string): string => {
  // base 경로 제거
  const url = originalUrl.replace(base, "");
  // 쿼리 파라미터 제거하고 pathname만 추출
  const pathname = url.split("?")[0];
  // 정규화 (중복 슬래시 제거, 상대 경로 처리)
  return path.normalize(`/${pathname}`);
};

/**
 * pathname을 정규화하는 함수
 * 빈 경로를 루트로 변환하고, 상품 상세 페이지 경로에 슬래시 추가
 *
 * @param {string} pathname - 원본 pathname
 * @returns {string} 정규화된 pathname
 */
export const normalizePathname = (pathname: string): string => {
  // 빈 경로는 루트 경로로 처리
  let normalized = pathname;
  if (!normalized || normalized === "") {
    normalized = "/";
  }
  // 상품 상세 페이지는 마지막에 /가 있어야 함
  // 예: /product/123 -> /product/123/
  const productMatch = normalized.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    normalized = normalized + "/";
  }
  return normalized;
};
