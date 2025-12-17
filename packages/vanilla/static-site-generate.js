import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { render } from "./dist/vanilla-ssr/main-server.js";
import items from "./src/mocks/items.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");

/**
 * HTML 템플릿 읽기
 */
function readTemplate() {
  const templatePath = path.join(DIST_DIR, "index.html");
  return fs.readFileSync(templatePath, "utf-8");
}

/**
 * 파일 경로 생성
 */
function getOutputPath(url) {
  if (url === "/" || url === "") {
    return path.join(DIST_DIR, "index.html");
  }

  // /product/85067212996/ -> product/85067212996/index.html
  const cleanUrl = url.replace(/^\//, "").replace(/\/$/, "");
  const dirPath = path.join(DIST_DIR, cleanUrl);
  const filePath = path.join(dirPath, "index.html");

  return { dirPath, filePath };
}

/**
 * HTML 파일 저장
 */
function writeHtml(filePath, html) {
  // 디렉토리 생성
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, html, "utf-8");
}

/**
 * 정적 사이트 생성
 */
async function generateStaticSite() {
  console.log("정적 사이트 생성 시작...");

  const template = readTemplate();

  // 1. 홈페이지 생성
  console.log("홈페이지 생성 중...");
  const homeResult = await render("/");
  const homeHtml = template
    .replace(`<!--app-head-->`, homeResult.head ?? "")
    .replace(`<!--app-html-->`, homeResult.html ?? "")
    .replace(
      `</body>`,
      homeResult.initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(homeResult.initialData)};</script></body>`
        : `</body>`,
    );
  writeHtml(path.join(DIST_DIR, "index.html"), homeHtml);
  console.log("✓ 홈페이지 생성 완료");

  // 2. 모든 상품 상세 페이지 생성
  console.log(`상품 상세 페이지 생성 중... (총 ${items.length}개)`);
  let successCount = 0;
  let failCount = 0;

  for (const item of items) {
    try {
      const productUrl = `/product/${item.productId}/`;
      const result = await render(productUrl);

      if (!result.html) {
        console.warn(`⚠ 상품 ${item.productId} 렌더링 실패: html이 없습니다`);
        failCount++;
        continue;
      }

      const html = template
        .replace(`<!--app-head-->`, result.head ?? "")
        .replace(`<!--app-html-->`, result.html ?? "")
        .replace(
          `</body>`,
          result.initialData
            ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(result.initialData)};</script></body>`
            : `</body>`,
        );

      const { filePath } = getOutputPath(productUrl);
      writeHtml(filePath, html);
      successCount++;

      if (successCount % 10 === 0) {
        console.log(`  진행 중... ${successCount}/${items.length}`);
      }
    } catch (error) {
      console.error(`✗ 상품 ${item.productId} 생성 실패:`, error.message);
      failCount++;
    }
  }

  console.log(`\n정적 사이트 생성 완료!`);
  console.log(`  성공: ${successCount}개`);
  console.log(`  실패: ${failCount}개`);
  console.log(`  총 ${items.length}개 상품 페이지 생성`);
}

// 실행
generateStaticSite().catch((error) => {
  console.error("정적 사이트 생성 중 에러 발생:", error);
  process.exit(1);
});
