import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SSG (Static Site Generation) 스크립트
 * - 홈페이지와 모든 상품 상세 페이지를 정적 HTML로 생성
 */
async function generateStaticSite() {
  console.log("🚀 Starting Static Site Generation...");

  try {
    // 1. SSR 렌더러와 mock 데이터 import
    const { render } = await import("./dist/react-ssr/main-server.js");
    const itemsModule = await import("./src/mocks/items.json", {
      with: { type: "json" },
    });
    const items = itemsModule.default;

    const outputDir = path.join(__dirname, "../../dist/react");

    // 빌드된 HTML에서 assets 파일명 추출
    const builtHtml = await fs.readFile(path.join(outputDir, "index.html"), "utf-8");
    const jsMatch = builtHtml.match(/src="([^"]*\.js)"/);
    const cssMatch = builtHtml.match(/href="([^"]*\.css)"/);
    const jsFile = jsMatch ? jsMatch[1] : "";
    const cssFile = cssMatch ? cssMatch[1] : "";

    console.log(`📦 Assets: JS=${jsFile}, CSS=${cssFile}`);

    // 2. 홈페이지 생성
    console.log("📄 Generating home page...");
    const homeRendered = await render("/front_7th_chapter4-1/react/", {});
    const homeHtml = buildHtml(homeRendered, jsFile, cssFile);
    await fs.writeFile(path.join(outputDir, "index.html"), homeHtml, "utf-8");
    console.log("✅ Home page generated");

    // 3. 404 페이지 생성 (홈페이지 복사)
    await fs.copyFile(path.join(outputDir, "index.html"), path.join(outputDir, "404.html"));
    console.log("✅ 404 page generated");

    // 4. 모든 상품 상세 페이지 생성
    console.log(`📦 Generating ${items.length} product pages...`);
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const productId = item.productId;
        const productUrl = `/front_7th_chapter4-1/react/product/${productId}/`;

        // 상품 페이지 렌더링
        const productRendered = await render(productUrl, {});
        const productHtml = buildHtml(productRendered, jsFile, cssFile);

        // 디렉토리 생성
        const productDir = path.join(outputDir, "product", productId);
        await fs.mkdir(productDir, { recursive: true });

        // HTML 파일 저장
        await fs.writeFile(path.join(productDir, "index.html"), productHtml, "utf-8");

        successCount++;
        if (successCount % 50 === 0) {
          console.log(`  ... ${successCount}/${items.length} products generated`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Failed to generate product ${item.productId}:`, error.message);
      }
    }

    console.log(`\n✅ Static Site Generation completed!`);
    console.log(`   - Home page: 1`);
    console.log(`   - Product pages: ${successCount}/${items.length}`);
    if (errorCount > 0) {
      console.log(`   - Errors: ${errorCount}`);
    }
    console.log(`   - Output: ${outputDir}`);
  } catch (error) {
    console.error("❌ Static Site Generation failed:", error);
    process.exit(1);
  }
}

/**
 * HTML 템플릿에 렌더링 결과를 주입
 */
function buildHtml(rendered, jsFile, cssFile) {
  const { head, html, __INITIAL_DATA__ } = rendered;

  // 기본 템플릿
  const template = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    ${head || ""}
    <script>window.__INITIAL_DATA__ = ${JSON.stringify(__INITIAL_DATA__ || {})};</script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: "#3b82f6",
              secondary: "#6b7280",
            },
          },
        },
      };
    </script>
    ${jsFile ? `<script type="module" crossorigin src="${jsFile}"></script>` : ""}
    ${cssFile ? `<link rel="stylesheet" crossorigin href="${cssFile}">` : ""}
  </head>
  <body class="bg-gray-50">
    <div id="root">${html || ""}</div>
  </body>
</html>`;

  return template;
}

// 실행
generateStaticSite();
