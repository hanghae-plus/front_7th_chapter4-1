import express from "express";
import compression from "compression";
import sirv from "sirv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { render } from "./dist/vanilla-ssr/main-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

/**
 * HTML 템플릿 생성 함수
 */
function createHtmlTemplate(html, baseUrl, isProd) {
  return `
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="${baseUrl}assets/index-${isProd ? "[hash]" : ""}.css">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#3b82f6',
              secondary: '#6b7280'
            }
          }
        }
      }
    </script>
  </head>
  <body class="bg-gray-50">
    <div id="root">${html}</div>
    <script type="module" src="${baseUrl}assets/index-${isProd ? "[hash]" : ""}.js"></script>
  </body>
</html>`.trim();
}

/**
 * SSR 렌더링 미들웨어
 */
async function ssrMiddleware(req, res, next) {
  try {
    const url = req.originalUrl.replace(base, "/") || "/";
    const query = req.query;

    // SSR 렌더링
    const html = await render(url, query);

    // HTML 템플릿 생성 및 응답
    const template = createHtmlTemplate(html, base, prod);
    res.setHeader("Content-Type", "text/html");
    res.send(template);
  } catch (error) {
    console.error("SSR Error:", error);
    next(error);
  }
}

/**
 * 에러 핸들링 미들웨어
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  console.error("Server Error:", err);
  res.status(500).send(`
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Server Error</title>
  </head>
  <body>
    <div style="padding: 20px; text-align: center;">
      <h1>서버 오류가 발생했습니다</h1>
      <p>${err.message}</p>
    </div>
  </body>
</html>
  `);
}

// 압축 미들웨어
app.use(compression());

// 정적 파일 서빙 (빌드된 클라이언트 파일들)
if (prod) {
  app.use(base, sirv(join(__dirname, "dist/vanilla"), { gzip: true }));
} else {
  // 개발 환경에서는 Vite가 정적 파일을 서빙하므로 여기서는 SSR만 처리
}

// SSR 렌더링 미들웨어
app.use("*", ssrMiddleware);

// 에러 핸들링 미들웨어
app.use(errorMiddleware);

// 서버 시작
app.listen(port, () => {
  console.log(`Vanilla SSR Server started at http://localhost:${port}`);
  console.log(`Base path: ${base}`);
  console.log(`Environment: ${prod ? "production" : "development"}`);
});
