process.env.NODE_ENV = "production";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../../dist/vanilla");
const items = JSON.parse(fs.readFileSync("./src/mocks/items.json", "utf-8"));

const { render } = await import("./src/main-server.js");
const { BASE_URL } = await import("./src/constants.js");

const TEMPLATE = fs.readFileSync(path.join(OUTPUT_DIR, "index.html"), "utf-8");

// 디렉토리 생성
function ensureDirectoryExists(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

// html 파일 생성
async function generatePage(url, outputPath) {
  try {
    const { html, head, initialData } = await render(url);

    const initialDataScript = `
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")};
    </script>
    `;

    const finalHtml = TEMPLATE.replace("<!--app-head-->", head)
      .replace("<!--app-html-->", html)
      .replace("</head>", `${initialDataScript}</head>`);

    // 파일 저장
    ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, finalHtml, "utf-8");
  } catch (error) {
    console.log("generatePage error: ", error);
  }
}

// ssg 실행
async function generateStaticSite() {
  await generatePage(BASE_URL, path.join(OUTPUT_DIR, "index.html"));

  for (const item of items) {
    const url = `${BASE_URL}product/${item.productId}/`;
    const outputPath = path.join(OUTPUT_DIR, "product", item.productId, "index.html");
    await generatePage(url, outputPath);
  }
}

// 실행
generateStaticSite();
