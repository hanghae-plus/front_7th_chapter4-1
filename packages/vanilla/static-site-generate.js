import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "./dist/vanilla-ssr");

// Mock 데이터 로드
const items = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./src/mocks/items.json"), "utf-8")).map((item) => ({
  ...item,
  title: item.title.replace(/\s+/g, " ").trim(),
}));

function mockGetProducts(params = {}) {
  const { limit = 20 } = params;

  // 가격순으로 정렬 (낮은 가격 우선)
  const sortedItems = [...items].sort((a, b) => {
    const priceA = parseInt(a.lprice);
    const priceB = parseInt(b.lprice);
    return priceA - priceB;
  });

  return sortedItems.slice(0, limit);
}

// 생성할 페이지 목록 만들기
async function getPages() {
  const products = mockGetProducts({ limit: 20 });

  const pages = [
    { url: "/", filePath: path.join(DIST_DIR, "index.html") },
    { url: "/404", filePath: path.join(DIST_DIR, "404.html") },
  ];

  // 각 상품의 상세 페이지 추가
  products.forEach((product) => {
    pages.push({
      url: `/product/${product.productId}/`,
      filePath: path.join(DIST_DIR, "product", product.productId, "index.html"),
    });
  });

  return pages;
}

//  SSG 빌드 함수
async function generateStaticSite() {
  try {
    console.log("Static Site Generation 시작...");

    // 1. 템플릿과 렌더 함수 로드
    const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");
    const { render } = await import(path.join(SSR_DIR, "main-server.js"));

    // 2. 생성할 페이지 목록 가져오기
    const pages = await getPages();
    console.log(`📄 총 ${pages.length}개의 페이지를 생성합니다...`);

    // 3. 각 페이지 렌더링 및 저장
    for (const page of pages) {
      console.log(`  - ${page.url} 생성 중...`);

      // SSR 실행
      const rendered = await render(page.url);

      // 초기 데이터 스크립트 생성
      const initialDataScript = rendered.initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData).replace(/</g, "\\u003c")}</script>`
        : "";

      // HTML 템플릿 치환
      const html = template
        .replace("<!--app-head-->", rendered.head || "")
        .replace("<!--app-html-->", rendered.html || "")
        .replace("</head>", `${initialDataScript}</head>`);

      // 폴더 생성 (product/123/ 같은 경로)
      const dir = path.dirname(page.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 파일 저장
      fs.writeFileSync(page.filePath, html, "utf-8");
    }

    console.log("✅ Static Site Generation 완료!");
  } catch (error) {
    console.error("❌ Static Site Generation 실패:", error);
    throw error;
  }
}

// 실행
generateStaticSite();
