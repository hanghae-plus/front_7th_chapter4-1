import fs from "node:fs/promises";
import express from "express";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

// Cached production assets
const templateHtml = prod ? await fs.readFile("./dist/client/index.html", "utf-8") : "";

const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
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
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

// SSR Render
app.get("*all", async (req, res) => {
  const url = req.originalUrl.replace(base, "");

  /** @type {string} */
  let template;
  /** @type {import('./src/entry-server.js').render} */
  let render;
  if (!prod) {
    // Always read fresh template in development
    template = await fs.readFile("./index.html", "utf-8");
    template = await vite.transformIndexHtml(url, template);
    render = (await vite.ssrLoadModule("/src/main-server.js")).render;
  } else {
    template = templateHtml;
    render = (await import("./dist/server/main-server.js")).render;
  }

  const rendered = await render(url);

  const html = template.replace(`<!--app-head-->`, rendered.head ?? "").replace(`<!--app-html-->`, rendered.html ?? "");

  res.send(html);
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
