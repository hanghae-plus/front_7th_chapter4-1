import fs from "node:fs/promises";
import express from "express";
import { server as mswServer } from "./src/mocks/server.js";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (isProduction ? "/front_7th_chapter4-1/vanilla/" : "/");

const templateHtml = isProduction ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

mswServer.listen({
  onUnhandledRequest: "bypass",
});

const app = express();

/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  // Vite 미들웨어는 정적 자산만 처리 (/@vite, /src, /node_modules 등)
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.use("*all", async (req, res) => {
  try {
    // base path 제거하되 query string은 유지
    const url = req.originalUrl.replace(base, "/");

    let template, render;
    if (!isProduction) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // render에 URL만 전달 (query는 URL에서 직접 파싱)
    const { html, head, initialData } = await render(url);

    // initialData를 JSON으로 직렬화하여 script 태그로 삽입
    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
      : "";

    const finalHtml = template
      .replace("<!--app-head-->", head ?? "")
      .replace("<!--app-html-->", html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
