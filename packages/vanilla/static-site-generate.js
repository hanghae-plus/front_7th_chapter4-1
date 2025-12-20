import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getProducts } from "./src/api/productApi.js";

// 현재 파일의 디렉토리 경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 경로 설정
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "./dist/vanilla-ssr");

// Express 서버를 임시로 띄워서 API 제공 (빌드 타임)
const apiServer = express();
const { createMockApiRouter } = await import("./src/mocks/apiRoutes.js");
apiServer.use("/api", createMockApiRouter());

// API 서버 시작
const API_PORT = 9999;
process.env.PORT = API_PORT.toString();
let httpServer;
await new Promise((resolve) => {
  httpServer = apiServer.listen(API_PORT, () => {
    console.log(`API server started on port ${API_PORT} for SSG`);
    resolve();
  });
});

// HTML 템플릿 읽기
async function getTemplate() {
  const templatePath = path.resolve(DIST_DIR, "./index.html");
  return await fs.readFile(templatePath, "utf-8");
}

// SSR 모듈 로드
async function getRenderFunction() {
  const { render } = await import(`file://${path.resolve(SSR_DIR, "./main-server.js")}`);
  return render;
}

// 페이지 목록 생성
async function getPages() {
  // 제한된 수의 상품만 가져오기 (예: 20개)
  const limit = 20;
  const response = await getProducts({ limit, page: 1 });
  const products = response.products;

  const pages = [
    { url: "/", filePath: path.resolve(DIST_DIR, "./index.html"), query: {} },
    { url: "/404", filePath: path.resolve(DIST_DIR, "./404.html"), query: {} },
    ...products.map((product) => ({
      url: `/product/${product.productId}/`,
      filePath: path.resolve(DIST_DIR, `./product/${product.productId}/index.html`),
      query: {},
    })),
  ];

  return pages;
}

// 디렉토리 생성 (없으면)
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// HTML 파일 저장
async function saveHtmlFile(filePath, html) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, html, "utf-8");
  console.log(`✓ Generated: ${filePath}`);
}

// HTML 템플릿에 렌더링 결과 삽입
function injectRenderedContent(template, rendered) {
  const initialDataScript = rendered.data
    ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.data)};</script>`
    : "";

  // 기존 __INITIAL_DATA__ 스크립트 태그 제거
  let html = template.replace(/<script[^>]*>window\.__INITIAL_DATA__\s*=\s*[^<]*<\/script>/gi, "");

  // head와 html 삽입
  html = html
    .replace(`<!--app-head-->`, `${rendered.head ?? ""}${initialDataScript ? ` ${initialDataScript}` : ""}`)
    .replace(`<!--app-html-->`, rendered.html ?? "");

  return html;
}

// 메인 함수
async function generateStaticSite() {
  try {
    console.log("🚀 Starting Static Site Generation (SSG)...\n");

    // 1. 템플릿 + SSR 모듈 로드
    console.log("📦 Loading template and SSR module...");
    const template = await getTemplate();
    const render = await getRenderFunction();

    // 2. 페이지 목록 생성
    console.log("📄 Generating page list...");
    const pages = await getPages();
    console.log(`Found ${pages.length} pages to generate (1 home + 1 404 + ${pages.length - 2} products)\n`);

    // 3. 각 페이지 렌더링 + 저장
    console.log("🔨 Rendering pages...");
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const rendered = await render(page.url, page.query || {});
      const html = injectRenderedContent(template, rendered);
      await saveHtmlFile(page.filePath, html);

      // 진행 상황 출력 (10개마다)
      if ((i + 1) % 10 === 0 || i === pages.length - 1) {
        console.log(`  Progress: ${i + 1}/${pages.length} pages generated`);
      }
    }

    console.log(`\n✅ SSG completed! Generated ${pages.length} pages`);
  } catch (error) {
    console.error("❌ SSG failed:", error);
    process.exit(1);
  } finally {
    // API 서버 종료
    if (httpServer) {
      httpServer.close();
      console.log("API server closed");
    }
  }
}

// 실행
generateStaticSite();
