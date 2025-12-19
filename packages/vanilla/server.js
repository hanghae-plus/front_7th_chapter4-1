import express from "express";
import compression from "compression";
import sirv from "sirv";
import { createServer as createViteServer } from "vite";
import { readFileSync } from "fs";
import { mswServer } from "./src/mocks/node.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

mswServer.listen({ onUnhandledRequest: "bypass" });

let vite;
if (!prod) {
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  app.use(compression());
  app.use(
    base,
    sirv("./dist/vanilla", {
      extensions: [],
    }),
  );
}

async function importModule(path) {
  if (!prod) {
    return await vite.ssrLoadModule(`/src/${path}`);
  } else {
    return await import(`./dist/vanilla-ssr/${path}`);
  }
}

app.use("*all", async (req, res) => {
  // TODO: render 를 import 더 잘해보기
  const { render } = await importModule("main-server.js");
  const { html, head, initialData } = await render(req.originalUrl.replace(base, ""));

  const template = prod ? readFileSync("./dist/vanilla/index.html", "utf-8") : readFileSync("./index.html", "utf-8");
  const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`;

  const finalHtml = template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);

  res.send(finalHtml);
});

app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
