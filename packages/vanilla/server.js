import express from "express";
import fs from "fs/promises";
import routes from "./src/routes.js";
import { createMiddleware } from "@mswjs/http-middleware";
import { handlers } from "./src/mocks/handlers.js";
import { createServer as createViteServer } from "vite";

const app = express();

const prod = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const render = async (component) => {
  return await component();
};

let vite;
// if (!prod) {
vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
  base,
});
app.use(vite.middlewares);
// } else {
//   // 배포 환경일 때는 정적 파일 서빙
//   app.use(base, express.static("dist"));
// }

app.use(createMiddleware(...handlers));
app.use(express.static("public"));

const styles = fs.readFile("./src/styles.css", "utf-8");

routes.forEach((route) => {
  if (route.path === ".*") {
    return app.get(async (req, res) => {
      const origin = `${req.protocol}://${req.get("host")}`;

      globalThis.origin = origin;
      globalThis.pathname = req.url;
      globalThis.params = req.params;
      globalThis.search = req.query;

      res.send(
        `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Vanilla Javascript SSR</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        ${await styles}
      </style>
    </head>
    <body>
    <div id="root">${await render(route.component)}</div>
    <script type="module" src="/src/main.js"></script>
    </body>
    </html>
      `.trim(),
      );
    });
  }

  app.get(route.path, async (req, res) => {
    const origin = `${req.protocol}://${req.get("host")}`;

    globalThis.origin = origin;
    globalThis.pathname = req.url;
    globalThis.params = req.params;
    globalThis.search = req.query;
    globalThis.initialData = {};

    const html = await render(route.component);

    res.send(
      `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla Javascript SSR</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      ${await styles}
    </style>
  </head>
  <body>
  <div id="root">${html}</div>
  <script type="module" src="/src/main.js"></script>
  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(globalThis.initialData)};
  </script>
  </body>
  </html>
    `.trim(),
    );
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
