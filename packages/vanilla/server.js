import express from "express";
import fs from "fs/promises";
import routes from "./src/routes.js";
import { createMiddleware } from "@mswjs/http-middleware";
import { handlers } from "./src/mocks/handlers.js";
import { createServer as createViteServer } from "vite";
import { render } from "./src/main-server.js";
import { runWithContext } from "./src/lib/asyncContext.js";

const app = express();

const prod = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5173;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

let vite;
let htmlTemplate = "";

if (!prod) {
  // 개발 환경: Vite 미들웨어 사용
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  // 프로덕션 환경: 빌드된 정적 파일 서빙
  const distPath = "./dist/vanilla";
  app.use(base, express.static(distPath));

  // 빌드된 index.html을 템플릿으로 로드
  htmlTemplate = await fs.readFile(`${distPath}/index.html`, "utf-8");
}

app.use(createMiddleware(...handlers));
app.use(express.static("public"));

const styles = fs.readFile("./src/styles.css", "utf-8");

// HTML 생성 헬퍼 함수
async function generateHtml({ html, title, metaTags = "", initialData }) {
  if (prod) {
    // 프로덕션: 빌드된 템플릿 사용
    let result = htmlTemplate
      .replace("<title>Document</title>", `<title>${title}</title>`)
      .replace("<!--app-head-->", metaTags)
      .replace("<!--app-html-->", html);

    // </body> 직전에 initialData 주입
    result = result.replace(
      "</body>",
      `  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
  </script>
</body>`,
    );

    return result;
  } else {
    // 개발: 간단한 템플릿 (Vite가 /src/main.js 처리)
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${metaTags}
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${await styles}
  </style>
</head>
<body class="bg-gray-50">
  <div id="root">${html}</div>
  <script type="module" src="/src/main.js"></script>
  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
  </script>
</body>
</html>`.trim();
  }
}

routes.forEach((route) => {
  if (route.path === ".*") {
    return app.get(async (req, res) => {
      const origin = `${req.protocol}://${req.get("host")}`;

      // 요청별로 격리된 컨텍스트 생성
      const context = {
        origin,
        pathname: req.url,
        params: req.params,
        search: req.query,
        initialData: {},
      };

      await runWithContext(context, async () => {
        // globalThis에도 설정 (하위 호환성)
        globalThis.origin = context.origin;
        globalThis.pathname = context.pathname;
        globalThis.params = context.params;
        globalThis.search = context.search;
        globalThis.initialData = context.initialData;

        const html = await render(route.component);

        res.send(
          await generateHtml({
            html,
            title: "404 - Page Not Found",
            metaTags: '<meta name="description" content="페이지를 찾을 수 없습니다" />',
            initialData: context.initialData,
          }),
        );
      });
    });
  }

  app.get(route.path, async (req, res) => {
    const origin = `${req.protocol}://${req.get("host")}`;

    // 요청별로 격리된 컨텍스트 생성
    const context = {
      origin,
      pathname: req.url,
      params: req.params,
      search: req.query,
      initialData: {},
    };

    await runWithContext(context, async () => {
      // globalThis에도 설정 (하위 호환성)
      globalThis.origin = context.origin;
      globalThis.pathname = context.pathname;
      globalThis.params = context.params;
      globalThis.search = context.search;
      globalThis.initialData = context.initialData;

      const html = await render(route.component);

      // 메타태그 생성
      let metaTags = `<meta property="og:title" content="${route.title}" />`;
      let title = route.title;

      if (context.initialData.meta) {
        const meta = context.initialData.meta;
        title = meta.title;
        metaTags = `
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${meta.image}" />`;
      }

      res.send(
        await generateHtml({
          html,
          title,
          metaTags,
          initialData: context.initialData,
        }),
      );
    });
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
