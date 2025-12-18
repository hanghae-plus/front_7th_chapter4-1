import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

async function createServer() {
  const app = express();

  let vite;
  let templateHtml;
  let ssrModule;

  // 환경 분기
  if (prod) {
    // compression + sirv
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;

    app.use(compression());

    const distPath = path.resolve(__dirname, "dist");
    templateHtml = fs.readFileSync(path.resolve(distPath, "vanilla/index.html"), "utf-8");
    ssrModule = await import(path.resolve(distPath, "vanilla-ssr/main-server.js"));

    app.use(base, sirv(path.resolve(distPath, "vanilla"), { extensions: [] }));
  } else {
    // Vite dev server + middleware
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    app.use(vite.middlewares);
  }

  // 렌더링 파이프라인
  app.use("*all", async (req, res) => {
    try {
      const url = req.originalUrl.replace(base, "/");
      const query = req.query;

      let template;
      let render;

      if (prod) {
        template = templateHtml;
        render = ssrModule.render;
      } else {
        // 개발 환경: 매 요청마다 템플릿과 모듈 새로 로드
        template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const mod = await vite.ssrLoadModule("/src/main-server.js");
        render = mod.render;
      }

      // SSR 렌더링
      const { html: appHtml = "", head: appHead = "" } = (await render(url, query)) || {};

      // Template 치환
      const finalHtml = template.replace("<!--app-head-->", appHead).replace("<!--app-html-->", appHtml);

      res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
    } catch (e) {
      if (!prod && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });

  app.listen(port, () => {
    console.log(`Vanilla Server started at http://localhost:${port}`);
  });
}

createServer();
