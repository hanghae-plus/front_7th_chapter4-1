import express from "express";
import { createServer } from "vite";
import fs from "node:fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "");

const app = express();
// Cached production assets
const templateHtml = prod ? fs.readFileSync("./dist/vanilla/index.html", "utf-8") : "";

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
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const origin = `${req.protocol}://${req.get("host")}`;

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const rendered = await render(url, origin);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
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
