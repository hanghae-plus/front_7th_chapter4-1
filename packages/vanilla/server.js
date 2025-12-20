import express from "express";
import fs from "fs";
import { server as mswServer } from "./src/mocks/server.js";

mswServer.listen({ onUnhandledRequest: "bypass" });

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
}

// SSR HTML handler - HTML 요청만 처리
const ssrHandler = async (req, res, next) => {
  const url = req.originalUrl;

  // 정적 파일 요청은 스킵
  const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json)(\?.*)?$/.test(url);
  if (isStaticFile) {
    return next();
  }

  try {
    let cleanUrl = url.replace(base, "") || "/";
    // /로 시작하도록 정규화
    if (!cleanUrl.startsWith("/")) {
      cleanUrl = "/" + cleanUrl;
    }

    /** @type {string} */
    let template;
    /** @type {Function} */
    let render;

    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(cleanUrl, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const rendered = await render(cleanUrl);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
};

// 미들웨어 순서: SSR 핸들러 먼저, 그 다음 Vite/정적 파일
app.use(ssrHandler);

if (!prod) {
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
