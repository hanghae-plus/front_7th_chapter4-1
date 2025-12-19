import fs from "node:fs/promises";
import path from "node:path";

// MSW 서버 초기화 (API 모킹)
import { server as mswServer } from "./src/mocks/server.js";

// 경로 설정
const DIST_DIR = "../../dist/vanilla";
const SSR_DIR = "./dist/vanilla-ssr";

/**
 * 생성할 페이지 목록 반환
 * - 홈페이지
 * - 404 페이지
 * - 상품 상세 페이지들 (처음 20개 상품)
 */
const getPages = async (render) => {
  // 홈페이지 렌더링으로 상품 목록 가져오기 (render는 URL만 받음)
  const homeResult = await render("/");
  const products = homeResult.initialData?.products || [];

  const pages = [
    // 홈페이지
    { url: "/", filePath: `${DIST_DIR}/index.html` },
    // 404 페이지 (홈과 동일한 내용으로 fallback)
    { url: "/", filePath: `${DIST_DIR}/404.html` },
  ];

  // 상품 상세 페이지들
  for (const product of products) {
    pages.push({
      url: `/product/${product.productId}/`,
      filePath: `${DIST_DIR}/product/${product.productId}/index.html`,
    });
  }

  return pages;
};

/**
 * HTML 파일 저장
 */
const saveHtmlFile = async (filePath, content) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  console.log(`[SSG] 생성: ${filePath}`);
};

/**
 * 렌더링 결과를 템플릿에 적용
 */
const applyTemplate = (template, { html, head, initialData }) => {
  // initialData를 JSON으로 직렬화하여 script 태그로 삽입
  const initialDataScript = initialData
    ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
    : "";

  return template
    .replace("<!--app-head-->", head ?? "")
    .replace("<!--app-html-->", html ?? "")
    .replace("</head>", `${initialDataScript}</head>`);
};

/**
 * SSG 메인 함수
 */
const generateStaticSite = async () => {
  console.log("[SSG] 정적 사이트 생성 시작\n");

  // MSW 서버 시작
  mswServer.listen({
    onUnhandledRequest: "bypass",
  });

  try {
    // 1. 템플릿 로드
    const template = await fs.readFile(`${DIST_DIR}/index.html`, "utf-8");
    console.log("[SSG] 템플릿 로드 완료");

    // 2. SSR 모듈 로드
    const { render } = await import(`${SSR_DIR}/main-server.js`);
    console.log("[SSG] SSR 모듈 로드 완료\n");

    // 3. 페이지 목록 생성
    const pages = await getPages(render);
    console.log(`[SSG] 생성할 페이지: ${pages.length}개\n`);

    // 4. 각 페이지 렌더링 및 저장
    for (const page of pages) {
      try {
        const rendered = await render(page.url);
        const finalHtml = applyTemplate(template, rendered);
        await saveHtmlFile(page.filePath, finalHtml);
      } catch (error) {
        console.error(`[SSG] 실패: ${page.url} - ${error.message}`);
      }
    }

    console.log("\n[SSG] 정적 사이트 생성 완료");
  } finally {
    // MSW 서버 종료
    mswServer.close();
  }
};

// 실행
generateStaticSite().catch((error) => {
  console.error("[SSG] 치명적 오류:", error);
  process.exit(1);
});
