import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateStaticSite() {
  const { render } = await import("./dist/vanilla-ssr/main-server.js");

  const template = fs.readFileSync(path.resolve(__dirname, "../../dist/vanilla/index.html"), "utf-8");

  const itemsPath = path.resolve(__dirname, "src/mocks/items.json");
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));

  const pages = [{ url: "/", outputPath: "../../dist/vanilla/index.html" }];

  // 모든 상품 상세 페이지 추가
  items.forEach((item) => {
    pages.push({
      url: `/product/${item.productId}/`,
      outputPath: `../../dist/vanilla/product/${item.productId}/index.html`,
    });
  });

  // 각 페이지 생성
  for (const page of pages) {
    try {
      // SSR 렌더링
      const { html, head, initialDataScript } = await render(page.url, {});

      const result = template
        .replace("<!--app-head-->", head)
        .replace("<!--app-html-->", html)
        .replace("</head>", `${initialDataScript}</head>`);

      const outputPath = path.resolve(__dirname, page.outputPath);
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, result);
      console.log(`페이지 생성 완료 (${page.url})`);
    } catch (error) {
      console.error(`페이지 생성 실패 (${page.url}):`, error.message);
    }
  }
}

generateStaticSite().catch((error) => {
  console.error("❌ SSG 실행 실패:", error);
  process.exit(1);
});
