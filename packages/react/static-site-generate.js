import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateStaticSite() {
  console.log("Starting Static Site Generation...");

  // 빌드된 HTML 템플릿 읽기
  const templatePath = path.resolve(__dirname, "../../dist/react/index.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  // SSR 렌더 함수 로드
  const { render } = await import("./dist/react-ssr/main-server.js");

  // 상품 데이터 로드 (상품 ID 추출용)
  const itemsPath = path.resolve(__dirname, "./src/mocks/items.json");
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));

  // 생성할 페이지 목록
  const pages = [
    { url: "/", query: {} }, // 홈페이지
  ];

  // 모든 상품 상세 페이지 추가
  items.forEach((item) => {
    pages.push({
      url: `/product/${item.productId}/`,
      query: {},
    });
  });

  console.log(`Generating ${pages.length} pages...`);

  // 각 페이지 생성
  for (const page of pages) {
    try {
      console.log(`Generating: ${page.url}`);

      // 서버 사이드 렌더링 실행
      const { html, head, initialData } = await render(page.url, page.query);

      // 초기 데이터를 스크립트로 주입
      const initialDataScript = initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")}</script>`
        : "";

      // HTML 조립
      const finalHtml = template
        .replace("<!--app-html-->", html)
        .replace("<!--app-head-->", head)
        .replace("</head>", `${initialDataScript}</head>`);

      // 파일 경로 결정
      let filePath;

      if (page.url === "/") {
        filePath = path.resolve(__dirname, "../../dist/react/index.html");
      } else {
        // /product/123/ -> ../../dist/react/product/123/index.html
        const urlPath = page.url.replace(/\/$/, ""); // 마지막 슬래시 제거
        filePath = path.resolve(__dirname, `../../dist/react${urlPath}/index.html`);
      }

      // 디렉토리 생성
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // HTML 파일 저장
      fs.writeFileSync(filePath, finalHtml, "utf-8");

      console.log(`✓ Generated: ${filePath}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${page.url}:`, error);
    }
  }

  console.log(`Static site generation complete! Generated ${pages.length} pages.`);
}

// 실행
generateStaticSite().catch((error) => {
  console.error("Static site generation failed:", error);
  process.exit(1);
});
