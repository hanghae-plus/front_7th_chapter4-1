/**
 * Static Site Generation (SSG)
 *
 * SSG vs SSR 비교:
 * - SSG: 빌드 타임에 HTML 생성 → 정적 파일로 서빙 (CDN 캐싱 가능)
 * - SSR: 요청 타임에 HTML 생성 → 서버 필요 (동적 콘텐츠 지원)
 *
 * SSG의 장점:
 * - 서버 없이 정적 호스팅 가능 (GitHub Pages, Vercel, Netlify 등)
 * - CDN 엣지 캐싱으로 전세계 빠른 응답
 * - 서버 비용 절감
 *
 * SSG의 한계:
 * - 빌드 타임에 모든 페이지를 알아야 함
 * - 콘텐츠 변경 시 재빌드 필요
 * - 사용자별 개인화 콘텐츠 불가
 *
 * 빌드 순서:
 * 1. pnpm build:client → 클라이언트 번들 + HTML 템플릿 생성
 * 2. pnpm build:server → SSR용 서버 번들 생성
 * 3. node static-site-generate.js → 정적 HTML 파일들 생성
 *
 * 참고: https://vite.dev/guide/ssr#pre-rendering-ssg
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============================================
// 경로 설정
// ============================================
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "./dist/vanilla-ssr");

/**
 * HTML 템플릿에 SSR 결과 삽입
 * server.js의 injectSSRResult와 동일한 로직
 */
function injectSSRResult(template, rendered) {
  const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)}</script>`;

  return template
    .replace("<!--app-head-->", rendered.head ?? "")
    .replace("<!--app-html-->", rendered.html ?? "")
    .replace("</head>", `${initialDataScript}</head>`);
}

/**
 * 생성할 페이지 목록 수집
 *
 * 현재 구현:
 * - 홈페이지 (/)
 * - 404 페이지
 * - 상품 상세 페이지 (상위 20개 상품)
 *
 * 프로덕션에서는 전체 상품을 생성하거나,
 * 자주 접근되는 인기 상품만 SSG로 생성하고
 * 나머지는 CSR로 처리할 수 있습니다.
 */
function collectPages(mockGetProducts) {
  // 상위 20개 상품의 상세 페이지 생성
  // 전체 상품 생성이 필요하면 limit를 늘리거나 pagination 처리
  const { products } = mockGetProducts({ limit: 20 });

  return [
    // 정적 페이지
    { url: "/", output: "index.html" },
    { url: "/404", output: "404.html" },
    // 동적 페이지: 상품 상세
    ...products.map((product) => ({
      url: `/product/${product.productId}/`,
      output: `product/${product.productId}/index.html`,
    })),
  ];
}

/**
 * SSG 메인 함수
 */
async function generateStaticSite() {
  console.log("🚀 SSG 시작...\n");

  // Step 1: 템플릿 로드
  const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

  // Step 2: SSR 모듈 로드
  const ssrModule = await import(path.join(SSR_DIR, "main-server.js"));
  const { render, mockGetProducts } = ssrModule;

  // Step 3: 생성할 페이지 목록 수집
  const pages = collectPages(mockGetProducts);
  console.log(`📄 생성할 페이지: ${pages.length}개\n`);

  // Step 4: 각 페이지 렌더링 및 저장
  for (const page of pages) {
    // SSR 렌더링 (main-server.js의 render 함수 재사용)
    const rendered = await render(page.url);

    // 템플릿에 결과 삽입
    const finalHtml = injectSSRResult(template, rendered);

    // 디렉토리 생성 및 파일 저장
    const outputPath = path.join(DIST_DIR, page.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, finalHtml);

    console.log(`✅ ${page.output}`);
  }

  console.log("\n🎉 SSG 완료!");
}

// 실행
generateStaticSite().catch(console.error);
