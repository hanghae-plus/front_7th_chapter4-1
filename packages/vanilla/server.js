import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();
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
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "/");
    let template, render;

    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const { head, html, data } = await render(url, req.query);

    const appHtml = template
      .replace(`<!--app-head-->`, head ?? "")
      .replace(`<!--app-html-->`, html ?? "")
      .replace(`<!--app-data-->`, data ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(appHtml);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Vanilla Server started at http://localhost:${port}`);
});
