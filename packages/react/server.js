import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

// Cached production assets
const templateHtml = prod ? fs.readFileSync("./dist/react/index.html", "utf-8") : "";

const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// Serve HTML
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/entry-server.js').render} */
    let render;
    if (!prod) {
      // Always read fresh template in development
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);

      //entry point
      render = (await vite.ssrLoadModule("./src/main-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    const { head, html, initialDataScript } = await render(url);

    const finalHtml = template
      .replace(`<!--app-head-->`, head ?? "")
      .replace(`<!--app-html-->`, html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
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
