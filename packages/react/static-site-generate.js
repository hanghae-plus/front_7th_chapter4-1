import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// SSG는 항상 production 모드로 실행
process.env.NODE_ENV = "production";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../../dist/react");

async function generateStaticSite() {
  // SSR 모듈 불러오기
  const ssrModule = await import("./dist/react-ssr/main-server.js");
  const render = ssrModule.render;

  // HTML 템플릿 읽기
  const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

  // 생성할 페이지 목록
  const routes = [{ url: "/front_7th_chapter4-1/react/", query: {} }];

  // 상품 목록에서 상품 ID 추출하여 상세 페이지 경로 추가
  const items = JSON.parse(fs.readFileSync(path.resolve(__dirname, "src/mocks/items.json"), "utf-8"));

  items.forEach((item) => {
    routes.push({
      url: `/front_7th_chapter4-1/react/product/${item.productId}/`,
      query: {},
    });
  });

  console.log(`Generating ${routes.length} static pages...`);

  // 각 페이지 렌더링 및 저장
  for (const route of routes) {
    try {
      const { html, head, initialData } = await render(route.url, route.query);

      const initialDataScript = initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
        : "";

      const finalHtml = template
        .replace("<!--app-html-->", html)
        .replace("<!--app-head-->", head)
        .replace("</head>", `${initialDataScript}</head>`);

      // 파일 경로 생성
      let filePath;
      if (route.url === "/front_7th_chapter4-1/react/") {
        filePath = path.join(DIST_DIR, "index.html");
      } else {
        // /front_7th_chapter4-1/react/product/123/ -> product/123/index.html
        const relativePath = route.url.replace("/front_7th_chapter4-1/react/", "");
        const dir = path.join(DIST_DIR, relativePath);
        fs.mkdirSync(dir, { recursive: true });
        filePath = path.join(dir, "index.html");
      }

      fs.writeFileSync(filePath, finalHtml);
      console.log(`Generated: ${filePath}`);
    } catch (error) {
      console.error(`Failed to generate ${route.url}:`, error);
    }
  }

  // 404 페이지 복사
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");
  fs.writeFileSync(path.join(DIST_DIR, "404.html"), indexHtml);

  console.log("Static site generation complete!");
}

// 실행
generateStaticSite();
