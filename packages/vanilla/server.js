/**
 * Express SSR 서버
 *
 * 개발 환경: Vite 미들웨어 모드로 HMR 지원
 * 프로덕션 환경: 빌드된 에셋 서빙 + SSR 렌더링
 *
 * 참고: https://vite.dev/guide/ssr
 */
import express from "express";
import fs from "fs";

// 환경 설정
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

/**
 * URL 정규화
 * base URL을 제거하고 항상 "/"로 시작하도록 보장합니다.
 *
 * @param {string} originalUrl - 원본 요청 URL
 * @returns {string} 정규화된 URL (예: "/product/123/")
 */
function normalizeUrl(originalUrl) {
  let url = originalUrl.replace(base, "");
  if (!url.startsWith("/")) {
    url = "/" + url;
  }
  return url;
}

/**
 * HTML 템플릿에 SSR 결과 삽입
 *
 * @param {string} template - HTML 템플릿
 * @param {Object} rendered - SSR 렌더링 결과 { html, head, initialData }
 * @returns {string} 완성된 HTML
 */
function injectSSRResult(template, rendered) {
  const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData ?? {})}</script>`;

  return template
    .replace("<!--app-head-->", rendered.head ?? "")
    .replace("<!--app-html-->", rendered.html ?? "")
    .replace("</head>", `${initialDataScript}</head>`);
}

async function createServer() {
  const app = express();

  let vite;
  let template;
  let render;

  // ============================================
  // 환경별 설정
  // ============================================
  if (!prod) {
    // 개발 환경: Vite 미들웨어 모드
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    app.use(vite.middlewares);
  } else {
    // 프로덕션 환경
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;

    // 1. 응답 압축
    app.use(compression());

    // 2. 정적 에셋 서빙 (JS, CSS 등)
    // assets 디렉토리만 명시적으로 서빙하여 HTML은 SSR로 처리
    app.use(`${base}assets`, sirv("./dist/vanilla/assets", { maxAge: 31536000, immutable: true }));

    // 3. SSR용 템플릿과 render 함수 로드
    template = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
    render = (await import("./dist/vanilla-ssr/main-server.js")).render;
  }

  // ============================================
  // SSR 라우트 핸들러
  // ============================================
  app.use("*all", async (req, res) => {
    const url = normalizeUrl(req.originalUrl);

    try {
      if (!prod) {
        // 개발 환경: 매 요청마다 최신 코드 로드 (HMR 지원)
        template = fs.readFileSync("./index.html", "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/main-server.js")).render;
      }

      // SSR 렌더링 실행
      const rendered = await render(url);

      // 템플릿에 결과 삽입
      const html = injectSSRResult(template, rendered);

      // 응답 전송
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e) {
      // 에러 처리
      vite?.ssrFixStacktrace(e);
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });

  // ============================================
  // 서버 시작
  // ============================================
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
