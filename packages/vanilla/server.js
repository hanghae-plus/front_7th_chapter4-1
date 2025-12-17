import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import compression from "compression";
import sirv from "sirv";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";

const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

async function renderSSR(template, render, url, query) {
  const { head, html, initialDataScript } = await render(url, query);

  return template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);
}

function normalizeUrl(url, base) {
  if (base && url.startsWith(base)) {
    url = url.slice(base.length - 1);
  }
  if (!url.startsWith("/")) {
    url = "/" + url;
  }
  return url;
}

// 개발 모드
if (!prod) {
  // Vite dev server + middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);

  app.use("*all", async (req, res, next) => {
    const url = req.originalUrl;
    const query = req.query;

    try {
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

      // Vite의 HTML 변환 작업을 통해 Vite HMR 클라이언트를 주입하고,
      // Vite 플러그인의 HTML 변환도 적용합니다.
      // (예: @vitejs/plugin-react의 전역 초기화 코드)
      template = await vite.transformIndexHtml(url, template);

      // 서버의 진입점(Entry)을 로드합니다.
      // ssrLoadModule은 Node.js에서 사용할 수 있도록 ESM 소스 코드를 자동으로 변환합니다.
      // 추가적인 번들링이 필요하지 않으며, HMR과 유사한 동작을 수행합니다.
      const { render } = await vite.ssrLoadModule(path.resolve(__dirname, "src/main-server.js"));

      const finalHtml = await renderSSR(template, render, url, query);

      res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  // compression + sirv
  app.use(compression());
  app.use(base, sirv(path.resolve(__dirname, "./dist/vanilla"), { extensions: [] }));

  // SSR 렌더링
  app.use("*all", async (req, res, next) => {
    try {
      const url = normalizeUrl(req.originalUrl, base);
      const query = req.query;

      // 프로덕션 빌드된 템플릿과 SSR 모듈 로드
      const template = fs.readFileSync(path.resolve(__dirname, "./dist/vanilla/index.html"), "utf-8");
      const { render } = await import(path.resolve(__dirname, "./dist/vanilla-ssr/main-server.js"));

      const finalHtml = await renderSSR(template, render, url, query);

      res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
    } catch (e) {
      console.error("SSR Error:", e);
      next(e);
    }
  });
}

// Start http server
app.listen(port, () => {
  console.log(`Vanilla SSR Server started at http://localhost:${port}`);
});
