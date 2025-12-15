import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

async function bootstrapServer() {
  const app = express();

  const viteServer = await createViteServer({
    base,
    server: { middlewareMode: "ssr", hmr: true },
    appType: "custom",
  });

  app.use(viteServer.middlewares);

  app.get("*all", async (request, response, next) => {
    try {
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");

      template = await viteServer.transformIndexHtml(request.originalUrl, template);

      const { render } = await viteServer.ssrLoadModule("/src/entry-server.js");

      const { head, body, initialScript } = await render(request.originalUrl, request.query);

      const html = template
        .replace("<!--app-head-->", head)
        .replace("<!--app-html-->", body)
        .replace("</head>", `${initialScript}</head>`);

      response.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      viteServer.ssrFixStacktrace(error);
      next(error);
    }
  });

  // Start http server
  app.listen(port, () => {
    console.log(`React Server started at http://localhost:${port}`);
  });
}

bootstrapServer();
