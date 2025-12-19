/**
 * Vanilla JavaScript SSR 서버
 *
 * Express를 사용하여 SSR(Server-Side Rendering)을 제공하는 서버
 * 개발 환경에서는 Vite 개발 서버를 미들웨어로 사용하고,
 * 프로덕션 환경에서는 빌드된 파일을 서빙함
 */

import express from "express";
import { readFileSync } from "node:fs";
import compression from "compression";
import sirv from "sirv";
import { server as mswServer } from "./src/mocks/nodeServer.js";
import { DIST_CLIENT_DIR, DIST_SSR_DIR } from "./src/constants.js";
import { buildHtmlContent, createViteServer, extractPathname } from "./src/server/utils/ssrUtils.js";

/**
 * 환경 변수 설정
 */
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

/**
 * MSW 서버 시작 (API 모킹용)
 * SSR 렌더링 시 서버에서 API 호출이 발생하므로 MSW가 필요함
 */
mswServer.listen({
  onUnhandledRequest: "bypass", // 모킹하지 않은 요청은 그대로 통과
});

/**
 * 프로덕션 환경에서는 빌드된 HTML 템플릿을 미리 읽어둠
 * 개발 환경에서는 Vite가 동적으로 처리하므로 빈 문자열
 */
const templateHtml = prod ? readFileSync(`${DIST_CLIENT_DIR}/index.html`, "utf-8") : "";

const app = express();

/** @type {import('vite').ViteDevServer | undefined} */
let vite;
// 개발 환경일 경우
if (!prod) {
  // vite를 활용해 middlewares 설정
  vite = await createViteServer({ base });
  app.use(vite.middlewares);
} else {
  // 배포 환경일 경우
  // 응답 데이터를 압축해서 네트워크 성능을 개선하고
  // 빌드된 정적 파일(dist)을 CDN처럼 빠르게 서빙한다
  app.use(compression());
  app.use(base, sirv(DIST_CLIENT_DIR, { extensions: [] }));
}

/**
 * 모든 요청에 대해 SSR 렌더링 수행
 * 개발 환경에서는 Vite를 통해 모듈을 동적으로 로드하고,
 * 프로덕션 환경에서는 빌드된 파일을 사용함
 */
app.use("*all", async (req, res) => {
  try {
    // URL에서 base 경로 제거하고 pathname 추출
    const pathname = extractPathname(req.originalUrl, base);

    /**
     * 개발 환경과 프로덕션 환경에 따라 다른 방식으로 템플릿과 렌더 함수 로드
     */
    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;

    if (!prod) {
      // 개발 환경: Vite를 통해 동적으로 모듈 로드
      // readFileSync는 node:fs에서 import한 것을 사용 (fs는 node:fs/promises)
      template = readFileSync("./index.html", "utf-8");
      // Vite의 transformIndexHtml은 전체 URL을 받아야 하므로 originalUrl 사용
      template = await vite.transformIndexHtml(req.originalUrl, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      // 프로덕션 환경: 빌드된 파일 사용
      template = templateHtml;
      render = (await import(`${DIST_SSR_DIR}/main-server.js`)).render;
    }

    // SSR 렌더링 실행
    // req.query는 Express가 자동으로 파싱한 쿼리 파라미터 객체
    const rendered = await render(pathname, req.query);

    // HTML 템플릿에 렌더링된 내용 주입
    const html = buildHtmlContent(template, {
      head: rendered.head,
      html: rendered.html,
      __INITIAL_DATA__: rendered.__INITIAL_DATA__,
    });

    // 최종 HTML 응답
    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    // 에러 처리
    // Vite 개발 환경에서는 스택 트레이스 수정 (소스맵 적용)
    vite?.ssrFixStacktrace(e);
    console.error("SSR 렌더링 오류:", e.stack);
    res.status(500).end(e.stack);
  }
});

/**
 * HTTP 서버 시작
 */
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
