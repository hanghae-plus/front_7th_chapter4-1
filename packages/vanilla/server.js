import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function applyTemplate(template, out) {
  // render가 string만 반환하면 appHtml로 취급
  const head = typeof out === "string" ? "" : (out.head ?? "");
  const appHtml = typeof out === "string" ? out : (out.appHtml ?? "");

  return template.replace("<!--app-head-->", head).replace("<!--app-html-->", appHtml);
}

if (!prod) {
  // DEV: Vite를 Express 미들웨어로 붙임
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
  const ssrEntry = path.resolve(__dirname, "src/main-server.js");
  const { render } = await vite.ssrLoadModule(ssrEntry);

  // DEV 템플릿 치환: 원본 index.html을 읽고, Vite transform 후 치환
  app.use(async (req, res, next) => {
    try {
      const url = req.originalUrl;

      // 원본 index.html (프로젝트 루트)
      let template = await fs.readFile(path.join(__dirname, "index.html"), "utf-8");

      // Vite가 dev용으로 HTML 변환
      template = await vite.transformIndexHtml(url, template);

      // SSR render 결과로 치환
      const out = await render(url, req.query);
      const html = applyTemplate(template, out);

      res.status(200).set("Content-Type", "text/html").send(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  // PROD: dist 서빙
  const { render } = await import("./dist/vanilla-ssr/main-server.js");
  const distPath = path.join(__dirname, "dist/vanilla");

  app.use(base, express.static(distPath));

  // PROD 템플릿 치환: dist/index.html 읽고 치환해서 응답
  app.get(
    new RegExp(`^${base.replace(/\//g, "\\/")}(?!.*\\.(js|css|map|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf)$).*`),
    async (req, res, next) => {
      try {
        const template = await fs.readFile(path.join(distPath, "index.html"), "utf-8");
        const out = await render(req.originalUrl, req.query);
        const html = applyTemplate(template, out);

        res.status(200).set("Content-Type", "text/html").send(html);
      } catch (e) {
        next(e);
      }
    },
  );
}

app.listen(port, () => {
  console.log(`Vanilla SSR Server started at http://localhost:${port}${base}`);
});
