import express from "express";
import fs from "node:fs/promises";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

// MSW 서버 설정 (개발 모드에서만)
let mswServer;
if (!prod) {
  const { server } = await import("./src/mocks/server.js");
  mswServer = server;
  // MSW 서버 시작 - 모든 요청을 인터셉트
  mswServer.listen({ onUnhandledRequest: "bypass" });
  console.log("MSW server started");
}

const app = express();

let vite;
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

// API 요청은 별도 라우터에서 처리
// 서버에서 같은 서버로 HTTP 요청을 보내면 Express가 먼저 받아버리므로
// Express에서 직접 API를 처리하되, MSW 핸들러와 동일한 로직 사용
// 프로덕션 모드에서도 API 라우터가 필요함 (SSR에서 API 호출 시)
const { createMockApiRouter } = await import("./src/mocks/apiRoutes.js");
app.use("/api", createMockApiRouter());

app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl;

    // URL에서 쿼리 파라미터 파싱
    const urlObj = new URL(url, `http://localhost:${port}`);
    const query = {};
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    let template;
    let render;
    if (!prod) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = await fs.readFile("./dist/vanilla/index.html", "utf-8");
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const rendered = await render(url, query);

    // head와 data 삽입
    const initialDataScript = rendered.data
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.data)};</script>`
      : "";

    // 기존 __INITIAL_DATA__ 스크립트 태그 제거 후 새로운 스크립트 추가 (중복 방지)
    // Vite 변환 후에도 제거할 수 있도록 변환된 template에서 제거
    let html = template.replace(/<script[^>]*>window\.__INITIAL_DATA__\s*=\s*[^<]*<\/script>/gi, "");

    html = html
      .replace(`<!--app-head-->`, `${rendered.head ?? ""}${initialDataScript ? ` ${initialDataScript}` : ""}`)
      .replace(`<!--app-html-->`, rendered.html ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
