import { createStore } from "./lib/createStore.js";
import { productReducer, cartReducer, initialProductState, initialCartState, PRODUCT_ACTIONS } from "./stores/index.js";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages/index.js";
import items from "./mocks/items.json" with { type: "json" };

class ServerRouter {
  #routes;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  addRoute(path, handler) {
    // :id → (\\\\d+) 정규식 변환
    // paramNames 배열 저장
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  findRoute(url) {
    // 매칭 + params 추출
    const pathname = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0];

    for (const route of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { handler: route.handler, params };
      }
    }
    return { handler: null, params: {} };
  }
}

async function prefetchData(serverProductStore, serverCartStore, params) {
  // 카테고리 데이터 생성
  const categories = items.reduce((acc, item) => {
    const { category1, category2 } = item;
    if (!acc[category1]) {
      acc[category1] = [];
    }
    if (!acc[category1].includes(category2)) {
      acc[category1].push(category2);
    }
    return acc;
  }, {});

  if (params.id) {
    // 상품 상세 페이지
    const product = items.find((item) => item.id === params.id);
    if (product) {
      serverProductStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });
      serverProductStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CATEGORIES,
        payload: categories,
      });
    }
  } else {
    // 홈 페이지 (상품 목록)
    serverProductStore.dispatch({
      type: PRODUCT_ACTIONS.SET_PRODUCTS,
      payload: {
        products: items.slice(0, 20),
        totalCount: items.length,
      },
    });
    serverProductStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CATEGORIES,
      payload: categories,
    });
  }

  return {
    productState: serverProductStore.getState(),
    cartState: serverCartStore.getState(),
  };
}

export const render = async (url) => {
  try {
    // 1. Store 초기화 (서버용 독립적인 Store)
    const serverProductStore = createStore(productReducer, initialProductState);
    const serverCartStore = createStore(cartReducer, initialCartState);

    // 2. 서버 라우터 생성 및 라우트 매칭
    const serverRouter = new ServerRouter();
    serverRouter.addRoute("/", HomePage);
    serverRouter.addRoute("/product/:id/", ProductDetailPage);
    serverRouter.addRoute(".*", NotFoundPage);

    const matchedRoute = serverRouter.findRoute(url);

    // 3. 데이터 프리페칭
    const initialData = await prefetchData(serverProductStore, serverCartStore, matchedRoute.params);

    // 4. HTML 생성
    const PageComponent = matchedRoute.handler || NotFoundPage;
    const html = PageComponent ? PageComponent() : "";

    // 5. Head 태그 생성 (SEO)
    const productState = serverProductStore.getState();
    const currentProduct = productState.currentProduct;

    let head = "";
    if (currentProduct) {
      head = `
        <title>${currentProduct.title} | Shopping Mall</title>
        <meta name="description" content="${currentProduct.description || currentProduct.title}" />
        <meta property="og:title" content="${currentProduct.title}" />
        <meta property="og:description" content="${currentProduct.description || currentProduct.title}" />
        <meta property="og:image" content="${currentProduct.image}" />
      `;
    } else {
      head = `
        <title>Shopping Mall</title>
        <meta name="description" content="최고의 상품을 만나보세요" />
      `;
    }

    console.log({ url, hasData: !!initialData });

    return { html, head, initialData };
  } catch (error) {
    console.error("SSR Error:", error);
    return {
      html: "<div>Error loading page</div>",
      head: "<title>Error</title>",
      initialData: { productState: initialProductState, cartState: initialCartState },
    };
  }
};
