import fs from "fs";
import path from "path";
import { server } from "./src/mocks/node.ts";
import { getProducts } from "./src/api/productApi.ts";

const DIST_DIR = "../../dist/react";
const SSR_DIST_DIR = "./dist/react-ssr";

async function generateStaticSite() {
  server.listen();

  try {
    // 1. 템플릿 + SSR 모듈 로드
    const template = fs.readFileSync(`${DIST_DIR}/index.html`, "utf-8");
    const { render } = await import(`${SSR_DIST_DIR}/main-server.js`);

    // 2. 페이지 목록 생성
    const pages = await getPages(); // /, /404, /product/1/, /product/2/, ...

    console.log(`Generating ${pages.length} pages...`);

    // 3. 각 페이지 렌더링 + 저장
    for (const page of pages) {
      try {
        const rendered = await render(page.url, "http://localhost:4178", "");

        if (!rendered) {
          console.error(`Failed to render ${page.url}`);
          continue;
        }

        const html = template
          .replace(`<!--app-head-->`, rendered.head ?? "")
          .replace(`<!--app-html-->`, rendered.html ?? "");
        await saveHtmlFile(page.filePath, html);
        console.log(`✓ Generated: ${page.filePath}`);
      } catch (error) {
        // MSW 중복 patch 에러는 무시
        if (error.message && error.message.includes("already patched")) {
          // 무시하고 계속
        } else {
          console.error(`Error rendering ${page.url}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully generated ${pages.length} pages!`);
  } finally {
    server.close();
  }
}

async function saveHtmlFile(filePath, html) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(filePath, html, "utf-8");
}

async function getPages() {
  const { products } = await getProducts({ limit: 20 }, "http://localhost");
  return [
    { url: "/", filePath: `${DIST_DIR}/index.html` },
    { url: "/404", filePath: `${DIST_DIR}/404.html` },
    ...products.map((p) => ({
      url: `/product/${p.productId}/`,
      filePath: `${DIST_DIR}/product/${p.productId}/index.html`,
    })),
  ];
}

// 실행
generateStaticSite();
