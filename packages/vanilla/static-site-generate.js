import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "vite";
import { server as mswServer } from "./src/mocks/node.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, "../../dist/vanilla");
const TEMPLATE_PATH = join(__dirname, "../../dist/vanilla/index.html");

/**
 * 정적 사이트 생성
 */
async function generateStaticSite() {
  console.log("정적 사이트 생성 시작...");

  let vite;
  try {
    // 1. MSW 서버 시작
    mswServer.listen({
      onUnhandledRequest: "bypass",
    });
    console.log("MSW 서버 시작 완료");

    // 2. Vite 서버 생성
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // 3. 렌더 함수 로드 (Vite를 통해 모든 import 처리)
    const { render } = await vite.ssrLoadModule("./src/main-server.js");

    // 4. 템플릿 로드
    const template = readFileSync(TEMPLATE_PATH, "utf-8");
    console.log("HTML 템플릿 로드 완료");

    // 5. 페이지 목록 생성
    const pages = await getPages(vite);
    console.log(`총 ${pages.length}개 페이지 생성 예정`);

    // 6. 각 페이지 렌더링 및 저장
    for (const page of pages) {
      console.log(`페이지 생성 중: ${page.url}`);

      try {
        const { html, head, initialData } = await render(page.url, page.query || {});

        // 초기 데이터 스크립트 생성
        const initialDataScript = `
          <script>
            window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
          </script>
        `;

        // HTML 템플릿 치환
        const finalHtml = template
          .replace("<!--app-head-->", head)
          .replace("<!--app-html-->", html)
          .replace("</head>", `${initialDataScript}</head>`);

        // 디렉토리 생성 (필요한 경우)
        const dir = dirname(page.filePath);
        mkdirSync(dir, { recursive: true });

        // 파일 저장
        writeFileSync(page.filePath, finalHtml, "utf-8");
        console.log(`✓ ${page.filePath} 생성 완료`);
      } catch (error) {
        console.error(`페이지 생성 실패 (${page.url}):`, error);
      }
    }

    console.log("정적 사이트 생성 완료!");
  } catch (error) {
    console.error("정적 사이트 생성 오류:", error);
    process.exit(1);
  } finally {
    // Vite 서버와 MSW 서버 정리
    if (vite) {
      await vite.close();
    }
    mswServer.close();
  }
}

/**
 * 생성할 페이지 목록 반환
 */
async function getPages(vite) {
  const pages = [
    // 홈페이지
    {
      url: "/",
      filePath: join(DIST_DIR, "index.html"),
      query: {},
    },
    // 404 페이지
    {
      url: "/404",
      filePath: join(DIST_DIR, "404.html"),
      query: {},
    },
  ];

  try {
    // 상품 목록 조회 (동적 라우트용) - Vite를 통해 로드
    const { getProducts } = await vite.ssrLoadModule("./src/api/productApi.js");
    const productsResponse = await getProducts({ limit: 20, page: 1 });
    const products = productsResponse.products;

    // 상품 상세 페이지들 추가
    for (const product of products) {
      pages.push({
        url: `/product/${product.productId}/`,
        filePath: join(DIST_DIR, "product", product.productId, "index.html"),
        query: {},
      });
    }

    console.log(`${products.length}개 상품 상세 페이지 추가`);
  } catch (error) {
    console.error("상품 목록 조회 실패:", error);
    // 상품 목록 조회 실패해도 기본 페이지들은 생성
  }

  return pages;
}

// 스크립트 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStaticSite();
}

export { generateStaticSite };
