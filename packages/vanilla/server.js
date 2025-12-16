import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sirv from "sirv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/vanilla/" : "/");

const app = express();

// HTML 템플릿 읽기
const templatePath = path.join(__dirname, "index.html");
const template = fs.readFileSync(templatePath, "utf-8");

// SSR 렌더링 함수 import (비동기 초기화)
let render;
async function initializeRender() {
  if (prod) {
    // 프로덕션: 빌드된 서버 모듈 사용
    const serverModule = await import("./dist/vanilla-ssr/main-server.js");
    render = serverModule.render;
  } else {
    // 개발: 소스 파일 직접 import
    const serverModule = await import("./src/main-server.js");
    render = serverModule.render;
  }
}

// API 라우트 설정 (MSW handlers 로직을 Express 라우트로 구현)
async function setupAPIRoutes() {
  if (prod) return; // 프로덕션에서는 실제 API 서버 사용

  // handlers.js의 로직을 가져와서 Express 라우트로 구현
  const { default: items } = await import("./src/mocks/items.json", { with: { type: "json" } });

  const delay = async () => await new Promise((resolve) => setTimeout(resolve, 200));

  // 카테고리 추출 함수
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

  // 상품 검색 및 필터링 함수
  function filterProducts(products, query) {
    let filtered = [...products];
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

  // 상품 목록 API
  app.get("/api/products", async (req, res) => {
    await delay();
    const page = parseInt(req.query.page ?? req.query.current) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const category1 = req.query.category1 || "";
    const category2 = req.query.category2 || "";
    const sort = req.query.sort || "price_asc";

    const filteredProducts = filterProducts(items, { search, category1, category2, sort });
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
        hasNext: endIndex < filteredProducts.length,
        hasPrev: page > 1,
      },
      filters: { search, category1, category2, sort },
    });
  });

  // 상품 상세 API
  app.get("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const product = items.find((item) => item.productId === id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const detailProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    res.json(detailProduct);
  });

  // 카테고리 목록 API
  app.get("/api/categories", async (req, res) => {
    await delay();
    const categories = getUniqueCategories();
    res.json(categories);
  });
}

// 정적 파일 서빙 설정 (SSR 미들웨어보다 먼저 등록)
if (prod) {
  // 프로덕션: 빌드된 파일 서빙
  const distPath = path.join(__dirname, "dist/vanilla");
  // 디렉토리가 존재하는 경우에만 정적 파일 서빙
  if (fs.existsSync(distPath)) {
    app.use(
      base,
      sirv(distPath, {
        dev: false,
        onNoMatch: (req, res, next) => next(), // 파일이 없으면 다음 미들웨어로
      }),
    );
  } else {
    console.warn(`⚠️  프로덕션 모드이지만 빌드 디렉토리가 없습니다: ${distPath}`);
    console.warn("   개발 모드로 정적 파일을 서빙합니다.");
    // 개발 모드로 폴백
    app.use(
      "/src",
      sirv(path.join(__dirname, "src"), {
        dev: true,
        onNoMatch: (req, res, next) => next(),
      }),
    );
    app.use(
      "/public",
      sirv(path.join(__dirname, "public"), {
        dev: true,
        onNoMatch: (req, res, next) => next(),
      }),
    );
  }
} else {
  // 개발: 정적 파일 서빙 (src, public 폴더)
  app.use(
    "/src",
    sirv(path.join(__dirname, "src"), {
      dev: true,
      onNoMatch: (req, res, next) => next(), // 파일이 없으면 다음 미들웨어로
    }),
  );
  app.use(
    "/public",
    sirv(path.join(__dirname, "public"), {
      dev: true,
      onNoMatch: (req, res, next) => next(), // 파일이 없으면 다음 미들웨어로
    }),
  );
}

// API 라우트 설정 (개발 환경)
await setupAPIRoutes();

// 모든 라우트에 대해 SSR 처리 (Express 5.x 호환)
// 정적 파일이 처리되지 않은 경우에만 SSR 실행
app.use(async (req, res, next) => {
  // 정적 파일 요청은 건너뛰기
  if (req.path.startsWith("/src/") || req.path.startsWith("/public/")) {
    return next();
  }

  // API 요청은 위에서 처리되므로 여기서는 건너뛰기
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // render 함수가 아직 초기화되지 않았으면 초기화
  if (!render) {
    await initializeRender();
  }

  try {
    // URL과 쿼리 파라미터 추출
    const url = req.url.split("?")[0];
    const query = req.query;

    // 서버에서 렌더링
    const { html: appHtml, initialState } = await render(url, query);

    // HTML 템플릿에 삽입
    const html = template
      .replace("<!--app-html-->", appHtml || '<div id="root"></div>')
      .replace("<!--app-head-->", `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialState || {})};</script>`);

    res.send(html);
  } catch (error) {
    console.error("SSR 렌더링 오류:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>서버 오류</title>
        </head>
        <body>
          <h1>서버 오류가 발생했습니다</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

// 서버 시작 전에 render 함수 초기화
initializeRender()
  .then(() => {
    // Start http server
    app.listen(port, () => {
      console.log(`Vanilla SSR Server started at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("서버 초기화 실패:", error);
    process.exit(1);
  });
