import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import compression from "compression";
import sirv from "sirv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

async function createServer() {
  const app = express();

  // Vite 개발 서버 또는 프로덕션 설정
  let vite;
  if (!prod) {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });

    // Vite 미들웨어 사용
    app.use(vite.middlewares);
  } else {
    app.use(compression());
    app.use(base, sirv("./dist/vanilla", { extensions: [] }));
  }

  // / 로 시작하는 모든 경로 (/, /product/123 등)에 대해 SSR 처리
  app.get(/\/.*/, async (req, res) => {
    try {
      let url = req.originalUrl.replace(base, "");

      // base 제거 후 빈 문자열이거나 '/'로 시작하지 않으면 "/"로 시작하도록 설정
      if (!url || url === "") {
        url = "/";
      } else if (!url.startsWith("/")) {
        url = "/" + url;
      }

      // index.html 내용
      let template;

      // SSR 렌더 함수
      let render;

      if (!prod) {
        // 개발: Vite를 통해 동적으로 로드
        template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/main-server.js")).render;
      } else {
        // 프로덕션: 빌드된 파일 사용
        template = fs.readFileSync(path.resolve(__dirname, "./dist/vanilla/index.html"), "utf-8");
        render = (await import("./dist/vanilla-ssr/main-server.js")).render;
      }

      // 서버 사이드 렌더링 실행
      const rendered = await render(url);

      // 초기 데이터 스크립트 생성
      const initialDataScript = rendered.initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData).replace(/</g, "\\u003c")}</script>`
        : "";

      // HTML 템플릿 치환
      const html = template
        .replace("<!--app-head-->", rendered.head || "")
        .replace("<!--app-html-->", rendered.html || "")
        .replace("</head>", `${initialDataScript}</head>`);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      if (!prod && vite) {
        vite.ssrFixStacktrace(e);
      }

      console.error(e.stack);

      res.status(500).end(e.stack);
    }
  });

  // Start http server
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

createServer();
