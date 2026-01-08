import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// ES 모듈에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 모든 라우트 수집
 * @returns {Promise<Array<{url: string, query?: object}>>} 라우트 목록
 */
async function getRoutes() {
  // items.json 파일 읽기
  const itemsPath = path.resolve(__dirname, "./src/mocks/items.json");
  const itemsData = fs.readFileSync(itemsPath, "utf-8");
  const items = JSON.parse(itemsData);

  // 정적 라우트 (홈 페이지)
  const staticRoutes = [
    {
      url: "/",
      query: {},
    },
  ];

  // 동적 라우트 (상품 상세 페이지)
  // items.json에서 모든 상품 ID 추출
  const productRoutes = items.map((item) => ({
    url: `/product/${item.productId}/`,
    query: {},
  }));

  return [...staticRoutes, ...productRoutes];
}

/**
 * 파일 경로 결정
 * @param {string} route - 라우트 URL
 * @returns {string} 파일 경로
 */
function getFilePath(route) {
  const basePath = path.resolve(__dirname, "../../dist/react");

  if (route === "/") {
    return path.join(basePath, "index.html");
  }

  // /product/85067212996/ → dist/react/product/85067212996/index.html
  // 정적 서버에서 /product/85067212996/ 경로로 접근하면 product/85067212996/index.html을 찾음
  const routePath = route.replace(/^\/|\/$/g, ""); // 앞뒤 슬래시 제거
  return path.join(basePath, routePath, "index.html");
}

/**
 * 페이지 생성 함수
 * @param {Object} routeInfo - 라우트 정보 { url, query }
 * @param {string} template - HTML 템플릿
 * @returns {Promise<void>}
 */
async function generatePage(routeInfo, template) {
  try {
    // 빌드된 main-server.tsx에서 render 함수 import
    // dist/react-ssr/main-server.js 경로
    // Windows에서는 절대 경로를 file:// URL로 변환해야 함
    const serverModulePath = path.resolve(__dirname, "./dist/react-ssr/main-server.js");
    const serverModuleUrl =
      process.platform === "win32" && path.isAbsolute(serverModulePath)
        ? pathToFileURL(serverModulePath).href
        : "./dist/react-ssr/main-server.js";

    let render;
    try {
      const module = await import(serverModuleUrl);
      render = module.render;
    } catch (importError) {
      console.error(`❌ 모듈 import 실패: ${routeInfo.url}`, importError);
      throw importError;
    }

    // 렌더링
    let appHtml, appHead, initialData;
    try {
      const result = await render(routeInfo.url, routeInfo.query || {});
      appHtml = result.html;
      appHead = result.head;
      initialData = result.initialData;
    } catch (renderError) {
      console.error(`❌ 렌더링 실패: ${routeInfo.url}`, renderError);
      console.error(`❌ 에러 스택:`, renderError.stack);
      throw renderError;
    }

    // 초기 데이터 스크립트 (XSS 방지 처리)
    const dataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")};</script>`
      : "";

    // HTML 조립
    // 서버에서 이미 head에 포함했을 수 있으므로 확인 필요
    let finalHtml = template.replace("<!--app-html-->", appHtml);

    // <!--app-head-->가 있으면 교체, 없으면 </head> 앞에 삽입
    if (finalHtml.includes("<!--app-head-->")) {
      finalHtml = finalHtml.replace("<!--app-head-->", appHead);
    } else {
      finalHtml = finalHtml.replace("</head>", `${appHead}</head>`);
    }

    // 초기 데이터 스크립트 삽입 (</head> 앞)
    finalHtml = finalHtml.replace("</head>", `${dataScript}</head>`);

    // 파일 경로 결정
    const filePath = getFilePath(routeInfo.url);

    // 디렉토리 생성 & 파일 저장
    const dirPath = path.dirname(filePath);
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, finalHtml, "utf-8");

    console.log(`✅ 생성: ${routeInfo.url} → ${path.relative(path.resolve(__dirname, "../../dist"), filePath)}`);
  } catch (error) {
    console.error(`❌ 실패: ${routeInfo.url}`, error.message);
    throw error;
  }
}

/**
 * SSG 메인 함수
 */
async function generateStaticSite() {
  try {
    console.log("🚀 React SSG 빌드 시작...\n");

    // 1. 템플릿 읽기
    const templatePath = path.resolve(__dirname, "../../dist/react/index.html");
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `템플릿 파일을 찾을 수 없습니다: ${templatePath}\n빌드를 먼저 실행해주세요: pnpm run build:client-for-ssg`,
      );
    }
    const template = fs.readFileSync(templatePath, "utf-8");

    // 2. 모든 라우트 수집
    console.log("📋 라우트 수집 중...");
    const routes = await getRoutes();
    console.log(`   총 ${routes.length}개 라우트 발견 (홈: 1개, 상품: ${routes.length - 1}개)\n`);

    // 3. 각 라우트별 HTML 생성
    console.log("📄 HTML 파일 생성 중...\n");
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      process.stdout.write(`[${i + 1}/${routes.length}] `);
      await generatePage(route, template);
    }

    console.log("\n✅ React SSG 완료!");
    console.log(`📁 생성된 파일: ${routes.length}개`);
    console.log(`📂 위치: ${path.resolve(__dirname, "../../dist/react")}`);
  } catch (error) {
    console.error("\n❌ React SSG 빌드 실패:", error.message);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
