import fs from "node:fs/promises";
import path from "node:path";
import { server as mswServer } from "./src/mocks/server.ts";

const DIST_DIR = "../../dist/react";
const SSR_DIR = "./dist/react-ssr";

/**
 * 렌더링할 페이지 목록 생성
 * - 홈페이지 렌더링으로 상품 목록을 가져와 동적으로 페이지 생성
 */
async function getPages(render) {
  // 홈페이지 렌더링으로 상품 목록 가져오기
  const homeResult = await render("/");
  const products = homeResult.initialData?.products || [];

  console.log(`Found ${products.length} products for SSG`);

  const pages = [
    { url: "/", filePath: `${DIST_DIR}/index.html` },
    { url: "/", filePath: `${DIST_DIR}/404.html` },
  ];

  // 상품 상세 페이지들 동적 생성
  for (const product of products) {
    pages.push({
      url: `/product/${product.productId}/`,
      filePath: `${DIST_DIR}/product/${product.productId}/index.html`,
    });
  }

  return pages;
}

/**
 * 템플릿에 렌더링 결과 적용
 */
function applyTemplate(template, { html, head, initialData }) {
  const initialDataScript = initialData
    ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
    : "";

  return template
    .replace("<!--app-head-->", head ?? "")
    .replace("<!--app-html-->", html ?? "")
    .replace("</head>", `${initialDataScript}</head>`);
}

/**
 * HTML 파일 저장
 */
async function saveHtmlFile(filePath, content) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content);
  console.log(`Generated: ${filePath}`);
}

/**
 * SSG 메인 함수
 */
async function generateStaticSite() {
  console.log("Starting Static Site Generation...");

  // MSW 서버 시작
  mswServer.listen({ onUnhandledRequest: "bypass" });
  console.log("MSW server started");

  try {
    // 템플릿 읽기
    const template = await fs.readFile(`${DIST_DIR}/index.html`, "utf-8");
    console.log("Template loaded");

    // SSR 렌더 함수 로드
    const { render } = await import(`${SSR_DIR}/main-server.js`);
    console.log("SSR render function loaded");

    // 페이지 목록 생성
    const pages = await getPages(render);
    console.log(`Generating ${pages.length} pages...`);

    // 각 페이지 렌더링 및 저장
    for (const page of pages) {
      try {
        const rendered = await render(page.url);
        const finalHtml = applyTemplate(template, rendered);
        await saveHtmlFile(page.filePath, finalHtml);
      } catch (error) {
        console.error(`Error generating ${page.url}:`, error.message);
      }
    }

    console.log("Static Site Generation completed!");
  } finally {
    // MSW 서버 종료
    mswServer.close();
    console.log("MSW server closed");
  }
}

// 실행
generateStaticSite().catch(console.error);
