import fs from "fs";
import path from "path";
import { server } from "./src/mocks/server";
import { getProducts } from "./src/api/productApi";

interface Page {
  url: string;
  filePath: string;
}

async function generateStaticSite() {
  // MSW 서버 시작
  server.listen({ onUnhandledRequest: "bypass" });

  // 1. 템플릿 + SSR 모듈 로드
  const template = fs.readFileSync("../../dist/react/index.html", "utf-8");
  const { render } = await import(`./dist/react-ssr/main-server.js`);

  // 2. 페이지 목록 생성
  const pages = await getPages(); // /, /404, /product/1/, /product/2/, ...

  // 3. 각 페이지 렌더링 + 저장
  for (const page of pages) {
    const { head, html, initialDataScript } = await render(page.url);

    const finalHtml = template
      .replace(`<!--app-head-->`, head ?? "")
      .replace(`<!--app-html-->`, html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    // 디렉토리가 없으면 생성
    const dir = path.dirname(page.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(page.filePath, finalHtml);
    console.log(`✅ Generated: ${page.filePath}`);
  }

  // MSW 서버 종료
  server.close();
}

async function getPages(): Promise<Page[]> {
  // MSW가 가로챌 수 있도록 절대 URL로 fetch
  const response = await getProducts({ limit: 20 });
  const products = response.products;

  return [
    { url: "/", filePath: `../../dist/react/index.html` },
    { url: "/404", filePath: `../../dist/react/404.html` },
    ...products.map((p) => ({
      url: `/product/${p.productId}/`,
      filePath: `../../dist/react/product/${p.productId}/index.html`,
    })),
  ];
}

// 실행
generateStaticSite();
