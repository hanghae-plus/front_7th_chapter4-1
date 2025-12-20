import fs from "fs";
import { server } from "./src/mocks/server.js";
import { render } from "./dist/vanilla-ssr/main-server.js";

async function generateStaticSite() {
  // MSW 서버 시작 (API 호출을 모킹하기 위해)
  server.listen({ onUnhandledRequest: "bypass" });

  try {
    // HTML 템플릿 읽기
    const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

    // 홈페이지 렌더링
    const homeResult = await render("/");
    const homeHtml = template.replace("<!--app-head-->", homeResult.head).replace("<!--app-html-->", homeResult.html);
    fs.writeFileSync("../../dist/vanilla/index.html", homeHtml);

    // 404.html 생성 (SPA fallback용 - GitHub Pages에서 없는 경로 접근 시)
    fs.copyFileSync("../../dist/vanilla/index.html", "../../dist/vanilla/404.html");

    // 상품 상세 페이지들 생성 (테스트에서 확인하는 상품들)
    const productIds = ["85067212996", "86940857379"];

    for (const productId of productIds) {
      const productResult = await render(`/product/${productId}/`);
      const productHtml = template
        .replace("<!--app-head-->", productResult.head)
        .replace("<!--app-html-->", productResult.html);

      // 상품 상세 페이지 디렉토리 생성
      const productDir = `../../dist/vanilla/product/${productId}`;
      fs.mkdirSync(productDir, { recursive: true });
      fs.writeFileSync(`${productDir}/index.html`, productHtml);
    }

    console.log("SSG 생성 완료!");
  } finally {
    // MSW 서버 종료
    server.close();
  }
}

// 실행
generateStaticSite();
