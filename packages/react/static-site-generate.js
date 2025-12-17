import fs from "fs";
import path from "path";

// JSON 파일 읽기
const mockProducts = JSON.parse(fs.readFileSync("./src/mocks/items.json", "utf-8"));

async function generateStaticSite() {
  console.log("🚀 Starting static site generation...");

  // 1. HTML 템플릿 읽기 (빌드된 파일)
  const templatePath = "../../dist/react/index.html";
  const template = fs.readFileSync(templatePath, "utf-8");

  // 1-1. SSR용 템플릿 복사 (플레이스홀더 보존)
  const ssrTemplatePath = "../../dist/react/template.html";
  fs.writeFileSync(ssrTemplatePath, template);
  console.log("✅ SSR template saved to template.html");

  // 2. 서버 렌더 함수 import (빌드된 파일)
  const { render } = await import("./dist/react-ssr/main-server.js");

  // 3. 홈 페이지 생성 (쿼리 파라미터 없는 기본 상태)
  console.log("📄 Generating homepage...");
  const { html: homeHtml, state: homeState, meta: homeMeta } = await render("/", {});
  let homeResult = template
    .replace("<!--app-html-->", homeHtml)
    .replace(
      "<!--app-head-->",
      `<script>window.__INITIAL_DATA__ = ${JSON.stringify(homeState).replace(/</g, "\\u003c")}</script>`,
    );

  // 메타 태그 주입
  if (homeMeta) {
    homeResult = homeResult.replace(/<title>.*?<\/title>/, `<title>${homeMeta.title}</title>`);
    homeResult = homeResult.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${homeMeta.description}" />`,
    );
  }

  fs.writeFileSync("../../dist/react/index.html", homeResult);
  console.log("✅ Homepage generated");

  // 4. 404 페이지 복사
  fs.copyFileSync("../../dist/react/index.html", "../../dist/react/404.html");
  console.log("✅ 404 page copied");

  // 5. 각 상품 상세 페이지 생성
  const productDir = "../../dist/react/product";
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }

  console.log(`📦 Generating ${mockProducts.length} product pages...`);
  let generatedCount = 0;

  for (const product of mockProducts) {
    try {
      const {
        html: productHtml,
        state: productState,
        meta: productMeta,
      } = await render(`/product/${product.productId}/`, {});

      let productResult = template
        .replace("<!--app-html-->", productHtml)
        .replace(
          "<!--app-head-->",
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(productState).replace(/</g, "\\u003c")}</script>`,
        );

      // 메타 태그 주입
      if (productMeta) {
        productResult = productResult.replace(/<title>.*?<\/title>/, `<title>${productMeta.title}</title>`);
        productResult = productResult.replace(
          /<meta name="description" content=".*?" \/>/,
          `<meta name="description" content="${productMeta.description}" />`,
        );
      }

      // /product/123/ 폴더 생성 및 index.html 저장
      const dir = path.join(productDir, product.productId);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), productResult);

      generatedCount++;
      if (generatedCount % 100 === 0) {
        console.log(`  Progress: ${generatedCount}/${mockProducts.length} pages`);
      }
    } catch (error) {
      console.error(`❌ Error generating page for product ${product.productId}:`, error.message);
    }
  }

  console.log(`✅ ${generatedCount} product pages generated`);
  console.log("🎉 Static site generation complete!");
}

// 실행
generateStaticSite().catch((error) => {
  console.error("❌ Static site generation failed:", error);
  process.exit(1);
});
