import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

let vite;

if (!prod) {
  // 개발 환경: Vite dev server
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  // 프로덕션 환경: compression + sirv
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;

  app.use(compression());
  app.use(base, sirv(path.resolve(__dirname, "./dist/vanilla"), { extensions: [] }));
}

// 렌더링 파이프라인
app.use(async (req, res, next) => {
  // 정적 파일 요청은 건너뜀
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    return next();
  }
  try {
    let url = req.originalUrl.replace(base, "");
    // base를 제거한 후 leading slash가 없으면 추가
    if (!url.startsWith("/")) {
      url = "/" + url;
    }
    // 빈 문자열이면 "/" 로 처리
    if (url === "") {
      url = "/";
    }

    let template;
    let render;

    if (!prod) {
      // 개발 환경
      template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      // 프로덕션 환경
      template = fs.readFileSync(path.resolve(__dirname, "./dist/vanilla/index.html"), "utf-8");
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // 서버 렌더링 실행
    const rendered = await render(url);
    const { html, head, initialData } = rendered;

    // 초기 데이터 스크립트
    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")}</script>`
      : "";

    // Template 치환
    const finalHtml = template
      .replace("<!--app-head-->", head || "")
      .replace("<!--app-html-->", html)
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (e) {
    if (!prod) {
      vite.ssrFixStacktrace(e);
    }
    console.error(e);
    res.status(500).end(e.message);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
