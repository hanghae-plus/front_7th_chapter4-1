import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "dist/vanilla-ssr");

// Mock 데이터 로드
async function mockGetProducts(params = {}) {
  const { limit = 20 } = params;
  const itemsPath = path.resolve(__dirname, "src/mocks/items.json");
  const items = JSON.parse(await fs.readFile(itemsPath, "utf-8"));
  return items.slice(0, limit);
}

// 페이지 목록 생성
async function getPages() {
  const products = await mockGetProducts({ limit: 1000 }); // 모든 상품

  return [
    { url: "/", filePath: `${DIST_DIR}/index.html` },
    { url: "/404", filePath: `${DIST_DIR}/404.html` },
    ...products.map((p) => ({
      url: `/product/${p.productId}/`,
      filePath: `${DIST_DIR}/product/${p.productId}/index.html`,
    })),
  ];
}

// HTML 파일 저장
async function saveHtmlFile(filePath, html) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, html);
}

async function generateStaticSite() {
  console.log("Starting Static Site Generation...\n");

  // 1. 템플릿 + SSR 모듈 로드
  const templatePath = `${DIST_DIR}/index.html`;
  try {
    await fs.access(templatePath);
  } catch {
    console.error("Template not found. Run build:client-for-ssg first.");
    process.exit(1);
  }

  const template = await fs.readFile(templatePath, "utf-8");
  const { render } = await import(`${SSR_DIR}/main-server.js`);

  // 2. 페이지 목록 생성
  const pages = await getPages();
  console.log(`Generating ${pages.length} pages...\n`);

  // 3. 각 페이지 렌더링 + 저장
  for (const page of pages) {
    try {
      const { html: appHtml = "", head: appHead = "" } = await render(page.url, {});

      const html = template.replace("<!--app-head-->", appHead).replace("<!--app-html-->", appHtml);

      await saveHtmlFile(page.filePath, html);
      console.log(`${page.url} -> ${path.relative(DIST_DIR, page.filePath)}`);
    } catch (error) {
      console.error(`Failed to generate ${page.url}:`, error.message);
    }
  }

  console.log(`\n Static Site Generation completed!`);
  console.log(`   Output: ${DIST_DIR}`);
  console.log(`   Total pages: ${pages.length}`);
}

// 실행
generateStaticSite().catch(console.error);
