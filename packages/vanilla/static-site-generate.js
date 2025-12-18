import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 빌드 경로 설정
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "dist/vanilla-ssr");

/**
 * 디렉토리 생성 (존재하지 않으면)
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
}

/**
 * HTML 파일 저장
 */
async function saveHtmlFile(filePath, html) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, html, "utf-8");
  console.log(`  Generated: ${filePath}`);
}

/**
 * 생성할 페이지 목록 가져오기
 */
async function getPages(mockGetProducts) {
  // 모든 상품 가져오기 (limit을 크게 설정)
  const productsData = mockGetProducts({ limit: 1000 });
  const products = productsData.products;

  const pages = [
    // 홈페이지
    { url: "/", filePath: path.join(DIST_DIR, "index.html") },
    // 404 페이지
    { url: "/404", filePath: path.join(DIST_DIR, "404.html") },
  ];

  // 상품 상세 페이지들
  for (const product of products) {
    pages.push({
      url: `/product/${product.productId}/`,
      filePath: path.join(DIST_DIR, "product", product.productId, "index.html"),
    });
  }

  return pages;
}

/**
 * 정적 사이트 생성 메인 함수
 */
async function generateStaticSite() {
  console.log("🚀 Starting Static Site Generation...\n");

  try {
    // 1. 템플릿 읽기
    console.log("📄 Loading template...");
    const template = await fs.readFile(path.join(DIST_DIR, "index.html"), "utf-8");

    // 2. SSR 모듈 로드
    console.log("📦 Loading SSR module...");
    const ssrModule = await import(path.join(SSR_DIR, "main-server.js"));
    const { render, mockGetProducts } = ssrModule;

    // 3. 페이지 목록 생성
    console.log("📋 Generating page list...");
    const pages = await getPages(mockGetProducts);
    console.log(`   Found ${pages.length} pages to generate\n`);

    // 4. 각 페이지 렌더링 및 저장
    console.log("🔨 Generating pages...");
    for (const page of pages) {
      try {
        // 렌더링
        const { html: appHtml, head, initialData } = await render(page.url);

        // initialData 스크립트 생성
        const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`;

        // 템플릿 치환
        const finalHtml = template
          .replace("<!--app-head-->", head)
          .replace("<!--app-html-->", appHtml)
          .replace("</head>", `${initialDataScript}</head>`);

        // 파일 저장
        await saveHtmlFile(page.filePath, finalHtml);
      } catch (err) {
        console.error(`  Error generating ${page.url}:`, err.message);
      }
    }

    console.log("\n✅ Static Site Generation completed!");
    console.log(`   Total pages: ${pages.length}`);
  } catch (err) {
    console.error("❌ Static Site Generation failed:", err);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
