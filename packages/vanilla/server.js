import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const templateHTML = prod
  ? fs.readFileSync("./dist/vanilla/index.html", "utf-8")
  : fs.readFileSync("./index.html", "utf-8");

const app = express();

// 참고 - https://github.com/bluwy/create-vite-extra/blob/master/template-ssr-vanilla/server.js
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
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.get("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    let template = "";
    /** @type {import('./src/main-server.js').render} */
    let render;

    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("./src/main-server.js")).render;
    } else {
      template = templateHTML;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }
    const rendered = await render(url, req.query);

    const initialDataScript = rendered.initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>`
      : "";

    const html = template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace("<!--app-html-->", `${rendered.html ?? ""}${initialDataScript}`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    vite?.ssrFixStacktrace(error);
    console.error(error);
    res.status(500).send(error.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Vanilla Server started at http://localhost:${port}`);
});
