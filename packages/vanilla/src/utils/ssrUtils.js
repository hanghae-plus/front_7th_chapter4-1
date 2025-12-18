/**
 * SSR/SSG 관련 유틸리티 함수들
 */

/**
 * URL에서 쿼리 파라미터 파싱
 * @param {string} url - URL 문자열
 * @returns {{ pathname: string, query: Object }}
 */
export function parseUrl(url) {
  const [pathname, queryString] = url.split("?");
  const query = {};

  if (queryString) {
    const params = new URLSearchParams(queryString);
    for (const [key, value] of params) {
      query[key] = value;
    }
  }

  return { pathname, query };
}

/**
 * initialData 스크립트 태그 생성
 * @param {Object} initialData - 클라이언트로 전달할 초기 데이터
 * @returns {string} - script 태그 HTML
 */
export function createInitialDataScript(initialData) {
  return `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`;
}

/**
 * HTML 템플릿에 SSR 결과 삽입
 * @param {string} template - HTML 템플릿
 * @param {{ html: string, head: string, initialData: Object }} renderResult - 렌더링 결과
 * @returns {string} - 최종 HTML
 */
export function applyTemplate(template, { html, head, initialData }) {
  const initialDataScript = createInitialDataScript(initialData);

  return template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);
}
