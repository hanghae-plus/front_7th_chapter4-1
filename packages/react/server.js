import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

const app = express();

// Vite 개발 서버 또는 정적 파일 제공
let vite;
if (!prod) {
  const { createServer } = await import("vite");

  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;

  app.use(compression());
  app.use(base, sirv(path.resolve(__dirname, "./dist/react"), { extensions: [] }));
}

// SSR 핸들러
// NOTE(이진): path-to-regexp 이슈가 있어 정규식으로 경로 처리
app.get(/\/.*/, async (req, res) => {
  try {
    let url = req.originalUrl.replace(base, "");

    // base 제거 후 빈 문자열이거나 '/'로 시작하지 않으면 "/"로 시작하도록 설정
    if (!url || url === "") {
      url = "/";
    } else if (!url.startsWith("/")) {
      url = "/" + url;
    }

    // HTML 템플릿 로드
    let template;
    let render;

    if (!prod) {
      // 개발 모드: Vite를 통해 템플릿 로드 및 변환
      template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);

      // SSR 모듈 로드
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      // 프로덕션 모드: 빌드된 파일 사용
      template = fs.readFileSync(path.resolve(__dirname, "./dist/react/index.html"), "utf-8");
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    // 쿼리 파라미터 파싱
    const queryParams = {};
    const urlObj = new URL(req.originalUrl, `http://${req.headers.host}`);
    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // 서버 사이드 렌더링 실행
    const { html, head, initialData } = await render(url, queryParams);

    // 초기 데이터를 스크립트로 주입
    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")}</script>`
      : "";

    // HTML 조립
    const finalHtml = template
      .replace("<!--app-html-->", html)
      .replace("<!--app-head-->", head)
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (e) {
    if (!prod && vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error(e);
    res.status(500).end(e.message);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
