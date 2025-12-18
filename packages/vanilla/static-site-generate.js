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
import { server as mswServer } from "./src/mocks/nodeServer.js";
import { DIST_SSG_DIR } from "./src/constants.js";
import { createViteServer, generatePage } from "./src/server/utils/ssrUtils.js";

/**
 * 정적 페이지 생성 함수
 */
const generateStaticPages = async () => {
  // MSW 서버 시작 (SSR 렌더링 시 API 모킹 필요)
  mswServer.listen({ onUnhandledRequest: "bypass" });

  // Vite 서버 생성 (SSR 모듈 로드를 위해 필요)
  const viteServer = await createViteServer();

  try {
    // SSR 렌더 함수와 HTML 템플릿 로드
    const { render } = await viteServer.ssrLoadModule("./src/main-server.js");
    const template = fs.readFileSync(path.join(DIST_SSG_DIR, "index.html"), "utf-8");

    // 404 페이지 생성
    await generatePage("/404.html", render, template, DIST_SSG_DIR);
    // 홈 페이지 생성
    await generatePage("/", render, template, DIST_SSG_DIR);

    // 상품 목록 가져오기
    const { getProducts } = await viteServer.ssrLoadModule("./src/api/productApi.js");
    const { products } = await getProducts();

    // 각 상품 상세 페이지 생성 (병렬 처리)
    const productTasks = products.map((product) =>
      generatePage(`/product/${product.productId}/`, render, template, DIST_SSG_DIR),
    );
    await Promise.all(productTasks);
  } finally {
    // 리소스 정리
    mswServer.close();
    viteServer.close();
  }
};

// 정적 페이지 생성 실행
generateStaticPages();
