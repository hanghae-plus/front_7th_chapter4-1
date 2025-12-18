import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "./dist/vanilla-ssr");

// 페이지 목록 생성
async function getPages() {
  const { mockGetProducts } = await import(`${SSR_DIR}/main-server.js`);

  // 상품 목록 가져오기 (첫 20개)
  const { products } = await mockGetProducts({ limit: 20 });

  const pages = [
    { url: "/", filePath: path.join(DIST_DIR, "index.html") },
    { url: "/404", filePath: path.join(DIST_DIR, "404.html") },
  ];

  // 상품 상세 페이지들 추가
  for (const product of products) {
    pages.push({
      url: `/product/${product.productId}/`,
      filePath: path.join(DIST_DIR, `product/${product.productId}/index.html`),
    });
  }

  return pages;
}

// HTML 파일 저장
function saveHtmlFile(filePath, html) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, html, "utf-8");
}

async function generateStaticSite() {
  try {
    console.log("Starting static site generation...");

    // 템플릿 로드
    const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

    // SSR 모듈 로드
    const { render } = await import(`${SSR_DIR}/main-server.js`);

    // 페이지 목록 생성
    const pages = await getPages();
    console.log(`Generating ${pages.length} pages...`);

    // 각 페이지 렌더링 + 저장
    for (const page of pages) {
      try {
        console.log(`Generating: ${page.url}`);

        // 서버 렌더링
        const rendered = await render(page.url);
        const { html, head, initialData } = rendered;

        // 초기 데이터 스크립트
        const initialDataScript = initialData
          ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")}</script>`
          : "";

        // Template 치환
        const finalHtml = template
          .replace("<!--app-head-->", head || "")
          .replace("<!--app-html-->", html)
          .replace("</head>", `${initialDataScript}</head>`);

        // 파일 저장
        saveHtmlFile(page.filePath, finalHtml);
        console.log(`✓ Generated: ${page.filePath}`);
      } catch (error) {
        console.error(`Error generating ${page.url}:`, error);
      }
    }

    console.log("Static site generation completed!");
  } catch (error) {
    console.error("Static site generation failed:", error);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
