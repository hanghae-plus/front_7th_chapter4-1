import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

let vite;

// 개발 환경: Vite 미들웨어 통합
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: {
      middlewareMode: true,
    },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
} else {
  // 프로덕션 환경: 빌드된 정적 파일 서빙
  // base 경로를 문자열로 처리하는 커스텀 middleware
  const staticMiddleware = express.static(path.resolve(__dirname, "dist/vanilla"));
  app.use((req, res, next) => {
    // base 경로로 시작하는 요청만 정적 파일로 처리
    if (req.url.startsWith(base)) {
      // base 경로 제거하고 정적 파일 middleware로 전달
      req.url = req.url.slice(base.length - 1); // '/front_7th.../vanilla/' -> '/'
      staticMiddleware(req, res, next);
    } else {
      next();
    }
  });
}

// SSR 핸들러 (정규식 사용)
app.get(/.*/, async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    let template;
    let render;

    if (prod) {
      // === 프로덕션 ===
      template = fs.readFileSync(path.resolve(__dirname, "dist/vanilla/index.html"), "utf-8");
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    } else {
      // === 개발 환경 ===
      // 1) index.html 읽기
      template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

      // 2) Vite가 HTML 변환 (HMR 클라이언트 주입 등)
      template = await vite.transformIndexHtml(url, template);

      // 3) 서버 렌더 함수를 Vite로 로드 (캐시 없이 항상 최신)
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    }

    // 앱 렌더링
    const { html: appHtml, state } = await render(url, req.query);

    // 초기 상태를 스크립트로 주입 (XSS 방지)
    const stateScript = `
      <script>
        window.__INITIAL_STATE__ = ${JSON.stringify(state).replace(/</g, "\\u003c")}
      </script>
    `;

    // HTML 조립
    const html = template.replace("<!--app-html-->", appHtml).replace("<!--app-head-->", stateScript);

    // 응답
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (error) {
    // 에러 처리
    if (!prod && vite) {
      // Vite가 스택 트레이스 수정 (원본 소스 위치 표시)
      vite.ssrFixStacktrace(error);
    }
    console.error("SSR Error:", error.stack);
    res.status(500).end(error.stack);
  }
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
