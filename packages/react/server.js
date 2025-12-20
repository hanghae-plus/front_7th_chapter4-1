import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5176;
const base = prod ? "/front_7th_chapter4-1/react/" : "/";

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

  // Vite 내부 경로는 스킵 (/@react-refresh, /@vite/client 등)
  if (url.startsWith("/@") || url.startsWith("/node_modules/") || url.startsWith("/api/")) {
    return next();
  }

  // 정적 파일 요청은 스킵 (개발 환경의 tsx/ts 포함)
  const isStaticFile = /\.(js|jsx|ts|tsx|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|mjs)(\?.*)?$/.test(
    url,
  );
  if (isStaticFile) {
    return next();
  }

  try {
    let cleanUrl = url.replace(base, "") || "/";
    if (!cleanUrl.startsWith("/")) {
      cleanUrl = "/" + cleanUrl;
    }

    // query string 파싱
    const [pathname, queryString] = cleanUrl.split("?");
    const query = Object.fromEntries(new URLSearchParams(queryString || ""));

    /** @type {string} */
    let template;
    /** @type {Function} */
    let render;

    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(pathname, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      template = fs.readFileSync("./dist/react/index.html", "utf-8");
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    const rendered = await render(pathname, query);

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
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
