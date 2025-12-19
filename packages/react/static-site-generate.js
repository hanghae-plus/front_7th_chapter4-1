/**
 * 정적 사이트 생성 (SSG) 스크립트
 *
 * 모든 페이지를 미리 렌더링하여 정적 HTML 파일로 생성함
 * - 404 페이지
 * - 홈 페이지
 * - 각 상품 상세 페이지
 */

import fs from "node:fs";
import path from "node:path";
import { DIST_SSG_DIR } from "./src/constants.ts";
import { createViteServer, generatePage } from "./src/server/utils/ssrUtils.ts";

/**
 * 정적 페이지 생성 함수
 */
const generateStaticPages = async () => {
  // SSG 빌드 시 base 경로 설정 (vite.config.ts와 동일)
  const base = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/react/" : "/";

  // Vite 서버 생성 (SSR 모듈 로드를 위해 필요)
  // base 경로를 전달하여 SSG 빌드 시 올바른 경로 사용
  const viteServer = await createViteServer({ base });

  try {
    // MSW 서버 시작 (SSR 렌더링 시 API 모킹 필요)
    const { server: mswServer } = await viteServer.ssrLoadModule("./src/mocks/nodeServer.ts");
    mswServer.listen({ onUnhandledRequest: "bypass" });

    // SSR 렌더 함수와 HTML 템플릿 로드
    const { render } = await viteServer.ssrLoadModule("./src/main-server.tsx");
    const template = fs.readFileSync(path.join(DIST_SSG_DIR, "index.html"), "utf-8");

    // 404 페이지 생성
    await generatePage("/404.html", render, template, DIST_SSG_DIR);
    // 홈 페이지 생성
    await generatePage("/", render, template, DIST_SSG_DIR);

    // 상품 목록 가져오기
    const { getProducts } = await viteServer.ssrLoadModule("./src/api/productApi.ts");
    const { products } = await getProducts();

    // 각 상품 상세 페이지 생성 (병렬 처리)
    const productTasks = products.map((product) =>
      generatePage(`/product/${product.productId}/`, render, template, DIST_SSG_DIR),
    );
    await Promise.all(productTasks);

    // MSW 서버 종료
    mswServer.close();
  } finally {
    // Vite 서버 종료
    viteServer.close();
  }
};

// 정적 페이지 생성 실행
generateStaticPages();
