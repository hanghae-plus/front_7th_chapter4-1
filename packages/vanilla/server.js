import express from "express";
import { createServer } from "vite";
import fs from "node:fs";
import { server } from "./src/mocks/node.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "");

const DIST_DIR = "./dist/vanilla";
const SSR_DIST_DIR = "./dist/vanilla-ssr";

const app = express();
// Cached production assets
const templateHtml = prod ? fs.readFileSync(`${DIST_DIR}/index.html`, "utf-8") : "";

let vite;
if (!prod) {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv(DIST_DIR, { extensions: [] }));
}

app.use("*all", async (req, res) => {
  server.listen();
  try {
    const url = req.originalUrl;
    const origin = `${req.protocol}://${req.get("host")}`;

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;

    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      const mod = await vite.ssrLoadModule("/src/main-server.js");
      render = mod.render;
    } else {
      template = templateHtml;
      const mod = await import(`${SSR_DIST_DIR}/main-server.js`);
      render = mod.render;
    }

    const rendered = await render(url, origin, base);

    if (rendered) {
      const html = template
        .replace(`<!--app-head-->`, rendered.head ?? "")
        .replace(`<!--app-html-->`, rendered.html ?? "");

      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    }
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error(e.stack);
    // 프로덕션에서는 스택 트레이스 노출 방지
    if (prod) {
      res.status(500).end("Internal Server Error");
    } else {
      res.status(500).end(e.stack);
    }
  } finally {
    server.close();
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
