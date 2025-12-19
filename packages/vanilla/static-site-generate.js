import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { render } from "./src/main-server.js";
import { runWithContext } from "./src/lib/asyncContext.js";
import routes from "./src/routes.js";
import items from "./src/mocks/items.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 카테고리 추출 (handlers.js와 동일)
function getUniqueCategories() {
  const categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

// 상품 필터링 및 정렬 (handlers.js와 동일)
function filterAndSortProducts(query) {
  let filtered = [...items];

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  if (query.sort) {
    switch (query.sort) {
      case "price_asc":
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        break;
      case "price_desc":
        filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
        break;
      default:
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

// Global fetch 폴리필 (SSG 전용 - 로컬 데이터 반환)
function setupFetchPolyfill() {
  globalThis.fetch = async (url) => {
    const urlObj = new URL(url, "http://localhost");
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // /api/products
    if (pathname === "/api/products") {
      const page = parseInt(searchParams.get("page") || searchParams.get("current") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const search = searchParams.get("search") || "";
      const category1 = searchParams.get("category1") || "";
      const category2 = searchParams.get("category2") || "";
      const sort = searchParams.get("sort") || "price_asc";

      const filtered = filterAndSortProducts({ search, category1, category2, sort });
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginated = filtered.slice(startIndex, endIndex);

      return {
        ok: true,
        json: async () => ({
          products: paginated,
          pagination: {
            page,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
            hasNext: endIndex < filtered.length,
            hasPrev: page > 1,
          },
          filters: { search, category1, category2, sort },
        }),
      };
    }

    // /api/products/:id
    const productMatch = pathname.match(/^\/api\/products\/(.+)$/);
    if (productMatch) {
      const productId = productMatch[1];
      const product = items.find((item) => item.productId === productId);

      if (!product) {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: "Product not found" }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          ...product,
          description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
          rating: 4,
          reviewCount: 100,
          stock: 50,
          images: [product.image],
        }),
      };
    }

    // /api/categories
    if (pathname === "/api/categories") {
      return {
        ok: true,
        json: async () => getUniqueCategories(),
      };
    }

    throw new Error(`Unhandled fetch: ${url}`);
  };
}

// 프로덕션 설정
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const ORIGIN = "http://localhost:3000"; // SSG 빌드 시 임시 origin

// HTML 템플릿 로드 (Vite 빌드 결과 사용)
let htmlTemplate = null;

function loadHtmlTemplate() {
  if (!htmlTemplate) {
    const templatePath = path.resolve(DIST_DIR, "index.html");
    htmlTemplate = fs.readFileSync(templatePath, "utf-8");
  }
  return htmlTemplate;
}

// HTML 템플릿 생성 함수
function createHtmlTemplate({ html, title, metaTags, initialData }) {
  const template = loadHtmlTemplate();

  // Vite 빌드된 템플릿에서 필요한 부분만 치환
  let result = template
    .replace("<title>Document</title>", `<title>${title}</title>`)
    .replace("<!--app-head-->", metaTags)
    .replace("<!--app-html-->", html);

  // </body> 태그 직전에 initialData 스크립트 주입
  result = result.replace(
    "</body>",
    `  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
  </script>
</body>`,
  );

  return result;
}

// 페이지 렌더링 함수
async function renderPage(route, params = {}, query = {}) {
  const context = {
    origin: ORIGIN,
    pathname: route.path.replace(/:(\w+)/g, (_, key) => params[key] || ""),
    params,
    search: query,
    initialData: {},
  };

  let html = "";
  await runWithContext(context, async () => {
    // globalThis에도 설정 (하위 호환성)
    globalThis.origin = context.origin;
    globalThis.pathname = context.pathname;
    globalThis.params = context.params;
    globalThis.search = context.search;
    globalThis.initialData = context.initialData;

    html = await render(route.component);
  });

  // 메타태그 생성
  let metaTags = `<meta property="og:title" content="${route.title}" />`;
  let title = route.title;

  if (context.initialData.meta) {
    const meta = context.initialData.meta;
    title = meta.title;
    metaTags = `
  <meta name="description" content="${meta.description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:image" content="${meta.image}" />`;
  }

  return createHtmlTemplate({
    html,
    title,
    metaTags,
    initialData: context.initialData,
  });
}

// 파일 저장 함수
function saveHtmlFile(filePath, content) {
  const fullPath = path.join(DIST_DIR, filePath);
  const dir = path.dirname(fullPath);

  // 디렉토리 생성
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, "utf-8");
  console.log(`✅ Generated: ${filePath}`);
}

// SSG 메인 함수
async function generateStaticSite() {
  console.log("🚀 Starting Static Site Generation...\n");

  // Global fetch 폴리필 설정
  setupFetchPolyfill();
  console.log("📡 Fetch polyfill configured for local data\n");

  try {
    // 1. 홈페이지 생성
    console.log("📄 Generating home page...");
    const homeRoute = routes.find((r) => r.path === "/");
    if (homeRoute) {
      const homeHtml = await renderPage(homeRoute);
      saveHtmlFile("index.html", homeHtml);
    }

    // 2. 모든 상품 상세 페이지 생성
    console.log("\n📦 Generating product detail pages...");
    const productRoute = routes.find((r) => r.path === "/product/:id/");

    if (productRoute) {
      const productIds = items.map((item) => item.productId);
      console.log(`   Found ${productIds.length} products\n`);

      let successCount = 0;
      let failCount = 0;

      for (const productId of productIds) {
        try {
          const productHtml = await renderPage(productRoute, { id: productId });
          saveHtmlFile(`product/${productId}/index.html`, productHtml);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to generate product ${productId}:`, error.message);
          failCount++;
        }
      }

      console.log(`\n   ✅ Success: ${successCount} pages`);
      if (failCount > 0) {
        console.log(`   ❌ Failed: ${failCount} pages`);
      }
    }

    // 3. 404 페이지 생성
    console.log("\n🚫 Generating 404 page...");
    const notFoundRoute = routes.find((r) => r.path === ".*");
    if (notFoundRoute) {
      const notFoundHtml = await renderPage(notFoundRoute);
      saveHtmlFile("404.html", notFoundHtml);
    }

    console.log("\n✨ Static Site Generation completed successfully!");
    console.log(`📁 Output directory: ${DIST_DIR}\n`);
  } catch (error) {
    console.error("\n❌ SSG failed:", error);
    throw error;
  }
}

// 실행
generateStaticSite().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
