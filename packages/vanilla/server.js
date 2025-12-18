import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "cross-fetch/dist/node-polyfill.js";

// [App Logic]
import { createStore } from "./src/lib/createStore.js";
import { Router } from "./src/lib/Router.js";
import { registerRoutes } from "./src/router/routes.js";
import { router as globalRouter } from "./src/router/router.js";
import { productReducer } from "./src/stores/productStore.js";
import { cartReducer } from "./src/stores/cartStore.js";

// [MSW 설정 - Node.js 환경용]
import { setupServer } from 'msw/node';
import { handlers } from './src/mocks/handlers.js'; 

// [데이터 로드] API 처리를 위해 items.json을 직접 읽어옵니다.
import items from "./src/mocks/items.json" with { type: "json" };

const mswServer = setupServer(...handlers);
mswServer.listen({ onUnhandledRequest: 'bypass' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const app = express();

app.use("/src", express.static(path.join(__dirname, "src")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, "public")));

// ▼▼▼▼▼ [API 핸들러 추가 - 브라우저 요청 처리용] ▼▼▼▼▼

// 필터링 헬퍼 함수 (handlers.js의 로직 재사용)
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
      case "price_asc": filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice)); break;
      case "price_desc": filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice)); break;
      case "name_asc": filtered.sort((a, b) => a.title.localeCompare(b.title, "ko")); break;
      case "name_desc": filtered.sort((a, b) => b.title.localeCompare(a.title, "ko")); break;
      default: filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }
  return filtered;
}

// 1. 상품 목록 API
app.get('/api/products', (req, res) => {
  try {
    const page = parseInt(req.query.page || req.query.current || 1);
    const limit = parseInt(req.query.limit || 20);
    
    const filteredProducts = filterProducts(items, req.query);
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);

    res.json({
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. 상품 상세 API
app.get('/api/products/:id', (req, res) => {
  const product = items.find((item) => item.productId === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  
  // 상세 정보 Mocking
  res.json({
    ...product,
    description: `${product.title} 상세 설명...`,
    rating: 4.5,
    reviewCount: 100,
    stock: 50,
    images: [product.image]
  });
});

// 3. 카테고리 API
app.get('/api/categories', (req, res) => {
  const categories = {};
  items.forEach((item) => {
    if (!categories[item.category1]) categories[item.category1] = {};
    if (item.category2) categories[item.category1][item.category2] = {};
  });
  res.json(categories);
});

// ▲▲▲▲▲ [API 핸들러 끝] ▲▲▲▲▲

const renderHtml = ({ content, state }) => {
  const safeState = state || {}; 
  const stateJson = JSON.stringify(safeState) || '{}';

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vanilla Javascript Shopping Mall</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root">${content}</div>
  <script>
    window.__INITIAL_STATE__ = ${stateJson.replace(/</g, '\\u003c')};
  </script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`.trim();
};

const rootReducer = (state = {}, action) => {
  return {
    product: productReducer(state.product, action),
    cart: cartReducer(state.cart, action),
  };
};

// SSR 렌더링 라우트
app.get(/.*/, async (req, res) => {
  try {
    const store = createStore(rootReducer);
    const router = new Router(""); 
    registerRoutes(router);

    const match = router.match(req.path);
    if (!match) return res.status(404).send("Page Not Found");

    const { component: Component, params } = match;

    globalRouter.query = req.query;
    globalRouter.params = params;

    if (Component.fetchData) {
      await Component.fetchData({
        store,
        params,
        query: req.query
      });
    }

    const content = Component();
    const initialState = store.getState();
    const html = renderHtml({ content, state: initialState });

    res.send(html);

  } catch (err) {
    console.error("SSR Rendering Error:", err);
    res.status(500).send(err.stack);
  }
});

app.listen(port, () => {
  console.log(`🛒 SSR Server running at http://localhost:${port}`);
});