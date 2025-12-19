import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = prod ? "/front_7th_chapter4-1/react/" : "/";

const app = express();

let template;
let render;

if (prod) {
  template = fs.readFileSync(path.resolve(__dirname, "dist/react/index.html"), "utf-8");
  const ssrModule = await import("./dist/react-ssr/main-server.js");
  render = ssrModule.render;
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // HTML이 아닌 파일들에 대해서만 Vite 미들웨어 사용
  app.use((req, res, next) => {
    const url = req.originalUrl;
    // HTML 요청이 아닌 경우만 Vite 미들웨어로 전달
    if (url.includes(".") && !url.endsWith(".html")) {
      return vite.middlewares(req, res, next);
    }
    next();
  });

  // 모든 HTML 요청에 대해 SSR 처리
  app.use(async (req, res, next) => {
    const url = req.originalUrl.replace(base, "/");

    try {
      template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);

      const { render } = await vite.ssrLoadModule("/src/main-server.tsx");

      const query = req.query;
      const { html, head, initialData } = await render(url, query);

      const initialDataScript = initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
        : "";

      const finalHtml = template
        .replace("<!--app-html-->", html)
        .replace("<!--app-head-->", head)
        .replace("</head>", `${initialDataScript}</head>`);

      res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      next(e);
    }
  });

  app.listen(port, () => {
    console.log(`React Dev SSR Server started at http://localhost:${port}`);
  });
}

if (prod) {
  app.use(base, express.static(path.resolve(__dirname, "dist/react"), { index: false }));

  app.use("*all", async (req, res) => {
    const url = req.originalUrl;

    try {
      const query = req.query;
      const { html, head, initialData } = await render(url, query);

      const initialDataScript = initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
        : "";

      const finalHtml = template
        .replace("<!--app-html-->", html)
        .replace("<!--app-head-->", head)
        .replace("</head>", `${initialDataScript}</head>`);

      res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
    } catch (e) {
      console.error(e);
      res.status(500).send("Internal Server Error");
    }
  });

  app.listen(port, () => {
    console.log(`React SSR Server started at http://localhost:${port}`);
  });
}
