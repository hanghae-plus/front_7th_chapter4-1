import fs from "node:fs/promises";
import express from "express";
import { server as mswServer } from "./src/mocks/server.ts";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (isProduction ? "/front_7th_chapter4-1/react/" : "/");

// MSW 서버 시작 (Node.js 환경에서 API 모킹)
mswServer.listen({ onUnhandledRequest: "bypass" });

const app = express();

// Vite 개발 서버 또는 정적 파일 서빙
let vite;
if (!isProduction) {
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
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// SSR 요청 핸들러
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "/");

    let template, render;
    if (!isProduction) {
      // 개발 모드: Vite를 통해 템플릿과 SSR 모듈 로드
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      // 프로덕션 모드: 빌드된 파일 사용
      template = await fs.readFile("./dist/react/index.html", "utf-8");
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    // SSR 렌더링 실행
    const { html, head, initialData } = await render(url);

    // __INITIAL_DATA__ 스크립트 주입
    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
      : "";

    // 템플릿에 렌더링 결과 삽입
    const finalHtml = template
      .replace("<!--app-head-->", head ?? "")
      .replace("<!--app-html-->", html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
  } catch (e) {
    // 개발 모드에서는 Vite가 스택 트레이스를 정리
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`React SSR Server started at http://localhost:${port}`);
});
