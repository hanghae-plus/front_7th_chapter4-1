import fs from "node:fs/promises";
import express from "express";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

const app = express();

let vite;
let templateHtml = "";

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

  templateHtml = await fs.readFile("./dist/client/index.html", "utf-8");

  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    let template;
    let render;

    if (!prod) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/server/main-server.js")).render;
    }

    const { html: appHtml, head, state } = await render(url);

    let html = template.replace(`<!--app-head-->`, head ?? "").replace(`<!--app-html-->`, appHtml ?? "");

    const stateScript = state
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(state).replace(/</g, "\\u003c")}</script>`
      : "";

    html = html.replace(`<!--app-context-->`, stateScript);

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
