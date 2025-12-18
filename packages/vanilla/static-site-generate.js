import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 1. 경로 설정
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "dist");
const STATIC_DIR = path.resolve(__dirname, "../../dist/vanilla");
const TEMPLATE_PATH = path.resolve(__dirname, "../../dist/vanilla/index.html");
const SSR_MODULE_PATH = path.resolve(DIST_DIR, "vanilla-ssr/main-server.js");

async function generateStaticSite() {
  // 동적 import로 빌드된 SSR 모듈 로드
  const { render, mockGetProducts } = await import(SSR_MODULE_PATH);

  // 모든 상품 가져오기
  const { products } = await mockGetProducts({ limit: 1000 });

  // 동적 라우트 생성
  const productRoutes = products.map((product) => `/product/${product.productId}/`);

  // 생성할 페이지 목록 정의
  const routes = ["/", "/404", "/cart", ...productRoutes];

  // HTML 템플릿 읽기
  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  for (const route of routes) {
    // render() 호출로 HTML 및 초기 데이터 얻기
    const rendered = await render(route);

    // 템플릿에 치환
    const fullHtml = template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace(
        "<!--app-html-->",
        `${rendered.html ?? ""}${rendered.initialData ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>` : ""}`,
      );

    // 파일 경로 결정 (예: /product/1 → /product/1/index.html)
    const filePath = path.join(STATIC_DIR, route === "/" ? "index.html" : `${route}/index.html`);

    // 디렉토리 생성 후 파일 저장
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, fullHtml);
  }
}

// 실행
generateStaticSite();
