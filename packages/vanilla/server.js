import fs from "node:fs/promises";
import express from "express";
import { render } from "./src/main-server.js";

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
app.get("*", async (req, res) => {
  const url = req.originalUrl.replace(base, "");
  const { html, head, initialDataScript } = await render(url);

  // Template 치환
  const finalHtml = templateHtml
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);

  res.send(finalHtml);
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
