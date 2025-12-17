# React SSR & SSG Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Key Implementation Differences](#key-implementation-differences)
4. [Universal Router Pattern](#universal-router-pattern)
5. [Server-Side Rendering Setup](#server-side-rendering-setup)
6. [State Management with SSR](#state-management-with-ssr) ⚠️ **CRITICAL: getServerSnapshot**
7. [Hydration Strategy](#hydration-strategy)
8. [Static Site Generation](#static-site-generation)
9. [Build Configuration](#build-configuration) ⚠️ **CRITICAL: TypeScript Global Types**
10. [Testing & Validation](#testing--validation)
11. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
12. [Summary](#summary)

---

## Overview

This guide details how to implement Server-Side Rendering (SSR) and Static Site Generation (SSG) in the React project, adapting patterns from the vanilla implementation while maintaining React's declarative approach.

### Goals
- ✅ Server-side render React components using `renderToString`
- ✅ Support Universal Router (ServerRouter for server, Router for client)
- ✅ Initialize `useSyncExternalStore`-based state on the server
- ✅ **Add `getServerSnapshot` to `useSyncExternalStore` (React 18+ SSR requirement)**
- ✅ **Define TypeScript global types for `window.__INITIAL_DATA__`**
- ✅ Prevent hydration mismatches
- ✅ Generate static pages for all product detail routes
- ✅ Pass `pnpm run test:e2e:advanced` tests

### Critical Constraints

#### 1. Server/Client Environment Branching
**Server/client environment branching MUST happen OUTSIDE React components, not inside.**

❌ **Wrong:**
```tsx
// Inside component
function MyComponent() {
  const router = typeof window === 'undefined' ? serverRouter : clientRouter;
  // This will cause hydration mismatches!
}
```

✅ **Correct:**
```tsx
// Outside component, at module level or entry point
const router = typeof window === 'undefined'
  ? new ServerRouter(BASE_URL)
  : new Router(BASE_URL);

function MyComponent() {
  // Use the pre-selected router
  const route = useCurrentPage();
}
```

#### 2. useSyncExternalStore with SSR (React 18+)
**MUST provide `getServerSnapshot` as third parameter to `useSyncExternalStore`.**

❌ **Wrong:**
```tsx
// Missing getServerSnapshot - will cause hydration errors!
useSyncExternalStore(
  store.subscribe,
  () => store.getState()
);
```

✅ **Correct:**
```tsx
// With getServerSnapshot
useSyncExternalStore(
  store.subscribe,
  () => store.getState(),
  () => store.getState() // Server snapshot
);
```

#### 3. TypeScript Type Safety
**MUST define `window.__INITIAL_DATA__` in global type definitions.**

Create `src/types/global.d.ts`:
```typescript
declare global {
  interface Window {
    __INITIAL_DATA__?: {
      product: ProductState;
      cart: CartState;
      route: RouteState;
    };
  }
}
export {};
```

---

## Architecture Comparison

### Vanilla Project Structure
```
vanilla/
├── server.js                 # Express server with SSR middleware
├── src/
│   ├── main.js              # Client entry (CSR)
│   ├── main-server.js       # Server entry (SSR render function)
│   ├── lib/
│   │   ├── Router.js        # Client router with window/history
│   │   └── ServerRouter.js  # Server router (URL matching only)
│   └── stores/              # Observable stores
└── static-site-generate.js  # SSG build script
```

### React Project Structure (Target)
```
react/
├── server.js                      # Express server with SSR middleware
├── src/
│   ├── main.tsx                   # Client entry (CSR + hydration)
│   ├── main-server.tsx            # Server entry (SSR render function)
│   ├── App.tsx                    # Root component
│   ├── router/
│   │   ├── router.ts              # Client Router instance
│   │   ├── ServerRouter.tsx       # Server Router component/instance
│   │   └── hooks/                 # useCurrentPage, useRouterParams
│   └── entities/
│       ├── products/productStore.ts  # useSyncExternalStore-based
│       └── carts/cartStore.ts        # useSyncExternalStore-based
└── static-site-generate.js        # SSG build script
```

---

## Key Implementation Differences

### 1. Rendering
| Aspect | Vanilla | React |
|--------|---------|-------|
| Render Method | Custom string concatenation | `renderToString()` from `react-dom/server` |
| Component Style | Imperative functions | Declarative JSX components |
| Router | Class-based with manual DOM | React component with hooks |

### 2. State Management
| Aspect | Vanilla | React |
|--------|---------|-------|
| Store Pattern | Custom observable | `useSyncExternalStore` |
| Subscribe | Manual subscription | React hook integration |
| SSR Initialization | Direct `dispatch()` calls | Same, but with React lifecycle |

### 3. Router Pattern
| Aspect | Vanilla | React |
|--------|---------|-------|
| Client | `Router` class with window events | Same `Router` from `@hanghae-plus/lib` |
| Server | `ServerRouter` class (pure matching) | `ServerRouter` wrapper/instance |
| Integration | Manual route matching | React hooks (`useCurrentPage`) |

---

## Universal Router Pattern

### The Pattern
Create separate router instances for server and client environments at the **module level**, before any React components are rendered.

### Implementation

#### 1. Create ServerRouter (if not exists in lib)

**Option A: Reuse vanilla's ServerRouter**
```tsx
// packages/lib/src/ServerRouter.ts
export class ServerRouter<Handler> {
  #routes: Map<string, Route<Handler>>;
  #currentRoute: Route<Handler> | null;
  #currentQuery: Record<string, string>;
  #baseUrl: string;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#currentRoute = null;
    this.#currentQuery = {};
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  // No window dependencies
  addRoute(path: string, handler: Handler) {
    const paramNames: string[] = [];
    let regex: RegExp;

    if (path.startsWith(".*") || path.startsWith("*")) {
      regex = new RegExp(".*");
    } else {
      const regexPath = path
        .replace(/:\w+/g, (match) => {
          paramNames.push(match.slice(1));
          return "([^/]+)";
        })
        .replace(/\//g, "\\/");
      regex = new RegExp(`^${regexPath}$`);
    }

    this.#routes.set(path, { regex, paramNames, handler });
  }

  match(url: string, query: Record<string, string> = {}) {
    const pathname = new URL(url, "http://localhost").pathname;
    this.#currentQuery = { ...query };

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        this.#currentRoute = {
          ...route,
          params,
          path: routePath,
        };

        return this.#currentRoute;
      }
    }

    this.#currentRoute = null;
    return null;
  }

  get query() { return this.#currentQuery; }
  get params() { return this.#currentRoute?.params ?? {}; }
  get route() { return this.#currentRoute; }
  get target() { return this.#currentRoute?.handler; }

  // Client API compatibility (no-ops on server)
  subscribe() {}
  push() {}
  start() {}
}
```

#### 2. Create Router Factory

```tsx
// src/router/createRouter.ts
import { Router } from "@hanghae-plus/lib";
import { ServerRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

// CRITICAL: Environment check happens OUTSIDE components
export const router = typeof window === 'undefined'
  ? new ServerRouter<FunctionComponent>(BASE_URL)
  : new Router<FunctionComponent>(BASE_URL);

export type RouterInstance = typeof router;
```

#### 3. Update router/index.ts

```tsx
// src/router/index.ts
export { router } from './createRouter';
export * from './hooks';
```

#### 4. Register Routes (both environments)

```tsx
// src/App.tsx or src/router/routes.ts
import { router } from "./router";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";

// These registrations work for both ServerRouter and Router
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);
```

### Why This Works
- **Single Source of Truth**: Same route definitions for server and client
- **No Hydration Mismatch**: Router type determined once, before rendering
- **Type Safety**: TypeScript ensures both routers implement the same interface
- **Clean Separation**: Environment detection in one place, not scattered across components

---

## Server-Side Rendering Setup

### 1. Update server.js

```javascript
// server.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5176;
const base = process.env.BASE || (prod ? "/front_7th_chapter4-1/react/" : "/");

const app = express();
let vite;

// Development: Vite middleware
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  // Production: Static files with query parameter handling
  const staticMiddleware = express.static(
    path.resolve(__dirname, "../../dist/react"),
    { index: false, fallthrough: true }
  );

  app.use(base, (req, res, next) => {
    const normalizedPath = req.path.replace(new RegExp(`^${base}`), "/");

    // Root with query params → SSR
    if (normalizedPath === "/" && Object.keys(req.query).length > 0) {
      return next();
    }

    // Root without query → static index.html
    if (normalizedPath === "/") {
      return res.sendFile(path.resolve(__dirname, "../../dist/react/index.html"));
    }

    // Other files → static serving
    staticMiddleware(req, res, next);
  });
}

// SSR handler
app.get(/.*/, async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const query = { ...req.query };

    let template;
    let render;

    if (prod) {
      // Production: Use built files
      template = fs.readFileSync(
        path.resolve(__dirname, "../../dist/react/template.html"),
        "utf-8"
      );
      render = (await import("./dist/react-ssr/main-server.js")).render;
    } else {
      // Development: Hot reload
      template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    }

    // Render the React app
    const { html: appHtml, state, meta } = await render(url, query);

    // Inject initial state
    const stateScript = `
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(state).replace(/</g, "\\u003c")}
      </script>
    `;

    // Assemble HTML
    let html = template
      .replace("<!--app-html-->", appHtml)
      .replace("<!--app-head-->", stateScript);

    // Inject meta tags
    if (meta) {
      html = html.replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`);
      html = html.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${meta.description}" />`
      );
    }

    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (error) {
    if (!prod && vite) {
      vite.ssrFixStacktrace(error);
    }
    console.error("SSR Error:", error.stack);
    res.status(500).end(error.stack);
  }
});

app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
```

### 2. Create main-server.tsx

```tsx
// src/main-server.tsx
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { router } from "./router";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./entities/products/productStore";
import { cartStore, CART_ACTIONS } from "./entities/carts/cartStore";
import mockProducts from "./mocks/items.json";
import type { Product } from "./entities/products/types";

// Register routes (same as client)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

// Server-side data fetcher (same as vanilla)
const serverFetch = {
  async getProducts(params = {}) {
    const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
    let filtered = [...mockProducts];

    if (search) {
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category1) {
      filtered = filtered.filter((p) => p.category1 === category1);
    }
    if (category2) {
      filtered = filtered.filter((p) => p.category2 === category2);
    }

    if (sort === "price_asc") {
      filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
    }

    return {
      products: filtered.slice(0, parseInt(limit)),
      totalCount: filtered.length,
    };
  },

  async getProduct(productId: string) {
    return mockProducts.find((p) => p.productId === productId) || null;
  },

  async getRelatedProducts(product: Product | null) {
    if (!product) return [];
    return mockProducts
      .filter((p) =>
        p.productId !== product.productId &&
        (p.category1 === product.category1 || p.category2 === product.category2)
      )
      .slice(0, 20);
  },

  async getCategories() {
    const categories: Record<string, Record<string, Record<string, never>>> = {};
    mockProducts.forEach((product) => {
      if (product.category1) {
        if (!categories[product.category1]) {
          categories[product.category1] = {};
        }
        if (product.category2) {
          categories[product.category1][product.category2] = {};
        }
      }
    });
    return categories;
  },
};

/**
 * Server-side render function
 */
export const render = async (url: string, query: Record<string, string> = {}) => {
  // 1. Reset stores (critical for SSR isolation)
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: initialProductState,
  });
  cartStore.dispatch({
    type: CART_ACTIONS.CLEAR_CART,
    payload: undefined,
  });

  // 2. Match route using ServerRouter
  const route = router.match(url, query);

  if (!route) {
    const html = renderToString(createElement(NotFoundPage));
    return {
      html,
      state: {
        product: productStore.getState(),
        cart: cartStore.getState(),
        route: { url, query, params: {} },
      },
    };
  }

  // 3. Pre-fetch data based on route
  try {
    if (route.path === "/") {
      const [productsData, categories] = await Promise.all([
        serverFetch.getProducts(query),
        serverFetch.getCategories(),
      ]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_PRODUCTS,
        payload: productsData,
      });
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CATEGORIES,
        payload: categories,
      });
    } else if (route.path === "/product/:id/") {
      const product = await serverFetch.getProduct(route.params.id);

      if (product) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: product,
        });

        const relatedProducts = await serverFetch.getRelatedProducts(product);
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: relatedProducts,
        });
      } else {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_ERROR,
          payload: "상품을 찾을 수 없습니다.",
        });
      }
    }
  } catch (error) {
    console.error("SSR data prefetching error:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
  }

  // 4. Render React component
  const PageComponent = route.handler;
  const html = renderToString(createElement(PageComponent));

  // 5. Generate meta tags
  let meta = {
    title: "쇼핑몰 - 홈",
    description: "항해플러스 프론트엔드 쇼핑몰",
  };

  if (route.path === "/product/:id/") {
    const product = productStore.getState().currentProduct;
    if (product) {
      meta = {
        title: `${product.title} - 쇼핑몰`,
        description: product.title,
      };
    }
  }

  // 6. Return rendered HTML and state
  const productState = productStore.getState();
  const cartState = cartStore.getState();

  return {
    html,
    state: {
      products: productState.products,
      categories: productState.categories,
      totalCount: productState.totalCount,
      product: productState,
      cart: cartState,
      route: { url, query, params: route.params },
    },
    meta,
  };
};
```

### 3. Update index.html Template

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>쇼핑몰 - 홈</title>
  <meta name="description" content="항해플러스 프론트엔드 쇼핑몰" />
  <!--app-head-->
</head>
<body>
  <div id="root"><!--app-html--></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## State Management with SSR

### Understanding useSyncExternalStore with SSR

React's `useSyncExternalStore` is designed for external state, but requires special handling for SSR:

1. **Server Snapshot**: On server, `getSnapshot()` is called once during render
2. **No Subscriptions**: `subscribe` is never called on server
3. **State Injection**: Server state is serialized to `window.__INITIAL_DATA__`
4. **Hydration**: Client reads `window.__INITIAL_DATA__` before first render
5. **getServerSnapshot**: **CRITICAL** - Required third parameter for SSR in React 18+

### Current Store Implementation (NEEDS UPDATE)

Your stores already use `useSyncExternalStore` via the `useStore` hook, but **MUST add `getServerSnapshot`**:

```tsx
// lib/src/hooks/useStore.ts
export const useStore = <T, S = T>(
  store: Store<T>,
  selector: (state: T) => S = defaultSelector<T, S>
) => {
  const shallowSelector = useShallowSelector(selector);

  // ❌ WRONG: Missing getServerSnapshot (will cause hydration errors)
  // return useSyncExternalStore(
  //   store.subscribe,
  //   () => shallowSelector(store.getState())
  // );

  // ✅ CORRECT: Include getServerSnapshot as third parameter
  return useSyncExternalStore(
    store.subscribe,
    () => shallowSelector(store.getState()),
    () => shallowSelector(store.getState()) // Server snapshot - same as client
  );
};
```

**Why `getServerSnapshot` is Required:**

React 18+ needs to know what value to use during server-side rendering. Without it, you'll get:
- Hydration mismatch warnings
- Incorrect initial render on server
- Potential runtime errors

The third parameter `getServerSnapshot` is called **only on the server** during SSR. In most cases, it returns the same value as the client `getSnapshot`, but it could differ if you need server-specific behavior.

### SSR State Initialization

**On Server (main-server.tsx):**
```tsx
// 1. Reset store to clean state
productStore.dispatch({
  type: PRODUCT_ACTIONS.SETUP,
  payload: initialProductState,
});

// 2. Load data
const productsData = await serverFetch.getProducts(query);

// 3. Update store
productStore.dispatch({
  type: PRODUCT_ACTIONS.SET_PRODUCTS,
  payload: productsData,
});

// 4. Serialize state
const state = {
  product: productStore.getState(),
  cart: cartStore.getState(),
};
```

**On Client (main.tsx):**
```tsx
// 1. Check for initial data
const initialData = window.__INITIAL_DATA__;

if (initialData) {
  // 2. Restore product state
  if (initialData.product) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData.product,
    });
  }

  // 3. Restore cart state
  if (initialData.cart) {
    cartStore.dispatch({
      type: CART_ACTIONS.LOAD_FROM_STORAGE,
      payload: initialData.cart,
    });
  }
}

// 4. Start router (client only)
router.start();

// 5. Hydrate instead of render
const rootElement = document.getElementById("root")!;
hydrateRoot(rootElement, <App />);
```

### Preventing Memory Leaks

**Critical for SSR**: Each request must have isolated state:

```tsx
// ❌ WRONG: Shared state across requests
const productStore = createStore(reducer, initialState);

export const render = async (url: string) => {
  // State persists between requests!
  const html = renderToString(<App />);
};
```

```tsx
// ✅ CORRECT: Reset state per request
const productStore = createStore(reducer, initialState);

export const render = async (url: string) => {
  // Reset to clean state
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: initialProductState,
  });

  // Now safe to render
  const html = renderToString(<App />);
};
```

---

## Hydration Strategy

### What is Hydration?

Hydration is the process where React attaches event listeners and makes a server-rendered page interactive.

**Flow:**
1. Server sends HTML with rendered content
2. Browser displays static HTML immediately (fast FCP)
3. React JS loads and executes
4. React "hydrates" the DOM, attaching event handlers
5. Page becomes interactive (TTI)

### Preventing Hydration Mismatches

**Common Causes:**
- Different content between server and client render
- Browser-specific APIs used during render (`window`, `localStorage`)
- Timestamps, random values, UUIDs generated during render
- Different router state on server vs client

### Rule: Server and Client Must Render Identically

```tsx
// ❌ WRONG: Different content on server/client
function MyComponent() {
  return (
    <div>
      {typeof window === 'undefined' ? 'Server' : 'Client'}
    </div>
  );
}
```

```tsx
// ✅ CORRECT: Same content, use useEffect for client-only code
function MyComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div>
      {!isClient ? 'Loading...' : 'Interactive!'}
    </div>
  );
}
```

### Hydration Checklist

1. **Router State**: Match server route to client route
   ```tsx
   // Server: router.match(url, query)
   // Client: router.start() must use same URL
   ```

2. **Store State**: Serialize and deserialize correctly
   ```tsx
   // Server: return { state: productStore.getState() }
   // Client: productStore.dispatch({ type: SETUP, payload: window.__INITIAL_DATA__ })
   ```

3. **No Browser APIs in Render**: Move to `useEffect`
   ```tsx
   // ❌ const data = localStorage.getItem('key')
   // ✅ useEffect(() => { const data = localStorage.getItem('key') }, [])
   ```

4. **Component Keys**: Ensure stable keys for lists
   ```tsx
   // ✅ {products.map(p => <ProductCard key={p.productId} product={p} />)}
   ```

### Update main.tsx for Hydration

```tsx
// src/main.tsx
import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { router } from "./router";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";
import { cartStore, CART_ACTIONS } from "./entities/carts/cartStore";
import { BASE_URL } from "./constants";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: { url: `${BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest: "bypass",
    })
  );

function main() {
  // 1. Restore state from SSR
  const initialData = (window as any).__INITIAL_DATA__;

  if (initialData) {
    if (initialData.product) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: initialData.product,
      });
    }
    if (initialData.cart) {
      cartStore.dispatch({
        type: CART_ACTIONS.LOAD_FROM_STORAGE,
        payload: initialData.cart,
      });
    }
  }

  // 2. Start client router
  router.start();

  // 3. Hydrate (not render!)
  const rootElement = document.getElementById("root")!;
  hydrateRoot(rootElement, <App />);
}

// Start app
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
```

---

## Static Site Generation

### Overview

SSG pre-renders all pages at build time, producing static HTML files that can be deployed to a CDN.

**Benefits:**
- Fastest possible page load (no server rendering)
- SEO-friendly (search engines see full HTML)
- Scalable (just static files)

### Implementation

```javascript
// static-site-generate.js
import fs from "fs";
import path from "path";

// Read product data
const mockProducts = JSON.parse(
  fs.readFileSync("./src/mocks/items.json", "utf-8")
);

async function generateStaticSite() {
  console.log("🚀 Starting static site generation...");

  // 1. Read built client template
  const templatePath = "../../dist/react/index.html";
  const template = fs.readFileSync(templatePath, "utf-8");

  // 1-1. Save SSR template (with placeholders)
  const ssrTemplatePath = "../../dist/react/template.html";
  fs.writeFileSync(ssrTemplatePath, template);
  console.log("✅ SSR template saved to template.html");

  // 2. Import server render function
  const { render } = await import("./dist/react-ssr/main-server.js");

  // 3. Generate homepage
  console.log("📄 Generating homepage...");
  const { html: homeHtml, state: homeState, meta: homeMeta } = await render("/", {});

  let homeResult = template
    .replace("<!--app-html-->", homeHtml)
    .replace(
      "<!--app-head-->",
      `<script>window.__INITIAL_DATA__ = ${JSON.stringify(homeState).replace(/</g, "\\u003c")}</script>`
    );

  if (homeMeta) {
    homeResult = homeResult.replace(
      /<title>.*?<\/title>/,
      `<title>${homeMeta.title}</title>`
    );
    homeResult = homeResult.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${homeMeta.description}" />`
    );
  }

  fs.writeFileSync("../../dist/react/index.html", homeResult);
  console.log("✅ Homepage generated");

  // 4. Copy 404 page
  fs.copyFileSync("../../dist/react/index.html", "../../dist/react/404.html");
  console.log("✅ 404 page copied");

  // 5. Generate product detail pages
  const productDir = "../../dist/react/product";
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }

  console.log(`📦 Generating ${mockProducts.length} product pages...`);
  let generatedCount = 0;

  for (const product of mockProducts) {
    try {
      const {
        html: productHtml,
        state: productState,
        meta: productMeta,
      } = await render(`/product/${product.productId}/`, {});

      let productResult = template
        .replace("<!--app-html-->", productHtml)
        .replace(
          "<!--app-head-->",
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(productState).replace(/</g, "\\u003c")}</script>`
        );

      if (productMeta) {
        productResult = productResult.replace(
          /<title>.*?<\/title>/,
          `<title>${productMeta.title}</title>`
        );
        productResult = productResult.replace(
          /<meta name="description" content=".*?" \/>/,
          `<meta name="description" content="${productMeta.description}" />`
        );
      }

      // Create /product/123/ directory with index.html
      const dir = path.join(productDir, product.productId);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), productResult);

      generatedCount++;
      if (generatedCount % 100 === 0) {
        console.log(`  Progress: ${generatedCount}/${mockProducts.length} pages`);
      }
    } catch (error) {
      console.error(`❌ Error generating page for product ${product.productId}:`, error.message);
    }
  }

  console.log(`✅ ${generatedCount} product pages generated`);
  console.log("🎉 Static site generation complete!");
}

// Run
generateStaticSite().catch((error) => {
  console.error("❌ Static site generation failed:", error);
  process.exit(1);
});
```

### Directory Structure After SSG

```
dist/react/
├── index.html              # Pre-rendered homepage
├── template.html           # Template for SSR (with placeholders)
├── 404.html               # 404 page
├── product/
│   ├── productId1/
│   │   └── index.html     # Pre-rendered product page
│   ├── productId2/
│   │   └── index.html
│   └── ...
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

---

## Build Configuration

### TypeScript Global Type Definitions

**CRITICAL**: Define global types for `window.__INITIAL_DATA__` to prevent TypeScript errors and ensure type safety.

Create a global type definition file:

```typescript
// src/types/global.d.ts
declare global {
  interface Window {
    __INITIAL_DATA__?: {
      // Product store state
      products: Product[];
      categories: Categories;
      totalCount: number;
      product: {
        products: Product[];
        totalCount: number;
        currentProduct: Product | null;
        relatedProducts: Product[];
        loading: boolean;
        error: string | null;
        status: string;
        categories: Categories;
      };
      // Cart store state
      cart: {
        items: Cart[];
        selectedAll: boolean;
      };
      // Route information
      route: {
        url: string;
        query: Record<string, string>;
        params: Record<string, string>;
      };
    };
  }
}

export {};
```

**Usage in main.tsx:**

```tsx
// Now TypeScript knows about window.__INITIAL_DATA__
const initialData = window.__INITIAL_DATA__;

if (initialData) {
  // TypeScript will autocomplete and type-check these properties
  if (initialData.product) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData.product,
    });
  }

  if (initialData.cart) {
    cartStore.dispatch({
      type: CART_ACTIONS.LOAD_FROM_STORAGE,
      payload: initialData.cart,
    });
  }
}
```

**Update tsconfig.json:**

Ensure the global types file is included:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["vite/client", "node"]
  },
  "include": [
    "src/**/*",
    "src/types/global.d.ts"  // Explicitly include global types
  ]
}
```

### Update package.json Scripts

```json
{
  "scripts": {
    "dev": "vite --port 5175",
    "dev:ssr": "PORT=5176 nodemon server.js",
    "build:client": "rm -rf ./dist/react && vite build --outDir ./dist/react && cp ./dist/react/index.html ./dist/react/404.html",
    "build:client-for-ssg": "rm -rf ../../dist/react && vite build --outDir ../../dist/react",
    "build:server": "vite build --outDir ./dist/react-ssr --ssr src/main-server.tsx",
    "build:without-ssg": "pnpm run build:client && pnpm run build:server",
    "build:ssg": "pnpm run build:client-for-ssg && node static-site-generate.js",
    "build": "pnpm run build:client && pnpm run build:server && pnpm run build:ssg",
    "preview:ssr": "PORT=4176 NODE_ENV=production node server.js",
    "preview:ssg": "NODE_ENV=production vite preview --outDir ../../dist/react --port 4179"
  }
}
```

### TypeScript Configuration

Ensure `tsconfig.json` allows Node.js imports:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["vite/client", "node"]
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
import react from "@vitejs/plugin-react";
import { createViteConfig } from "../../createViteConfig";

const base: string = process.env.NODE_ENV === "production"
  ? "/front_7th_chapter4-1/react/"
  : "";

export default createViteConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      // Ensure code splitting works with SSR
      output: {
        manualChunks: undefined,
      },
    },
  },
});
```

---

## Testing & Validation

### E2E Tests

The tests check three scenarios:
1. **CSR** (Client-Side Rendering): `http://localhost:5175/`
2. **SSR** (Server-Side Rendering): `http://localhost:5176/`
3. **SSG** (Static Site Generation): `http://localhost:4179/front_7th_chapter4-1/react/`

```typescript
// e2e/e2e-advanced.spec.ts
test.describe("E2E Test > 심화과제 (React)", () => {
  createCSRTest(`http://localhost:5175/`);
  createCSRTest(`http://localhost:4175/front_7th_chapter4-1/react/`);
  createSSRTest(`http://localhost:5176/`);
  createSSRTest(`http://localhost:4176/front_7th_chapter4-1/react/`);
  createSSGTest(`http://localhost:4179/front_7th_chapter4-1/react/`);
});
```

### Manual Testing Checklist

#### 1. CSR (Development)
```bash
pnpm run dev
# Visit http://localhost:5175/
```
- [ ] Homepage loads
- [ ] Product list displays
- [ ] Search/filter works
- [ ] Navigation to product detail works
- [ ] Cart functionality works

#### 2. SSR (Development)
```bash
pnpm run dev:ssr
# Visit http://localhost:5176/
```
- [ ] View page source shows full HTML (not just `<div id="root"></div>`)
- [ ] Page is interactive after hydration
- [ ] No hydration errors in console
- [ ] Query parameters work (e.g., `/?search=노트북`)
- [ ] Product detail pages load with correct meta tags

#### 3. SSR (Production)
```bash
pnpm run build:without-ssg
pnpm run preview:ssr
# Visit http://localhost:4176/front_7th_chapter4-1/react/
```
- [ ] Same as SSR dev checks
- [ ] Performance is good
- [ ] No console errors

#### 4. SSG (Production)
```bash
pnpm run build:ssg
pnpm run preview:ssg
# Visit http://localhost:4179/front_7th_chapter4-1/react/
```
- [ ] Homepage loads instantly
- [ ] Product pages load instantly (no server delay)
- [ ] View source shows full pre-rendered HTML
- [ ] Navigation between static pages works
- [ ] Dynamic features (cart, search) work after hydration

#### 5. Run E2E Tests
```bash
pnpm run serve:test  # Starts all servers
pnpm run test:e2e:advanced  # In another terminal
```
- [ ] All tests pass

---

## Common Pitfalls & Solutions

### 1. Hydration Mismatch

**Error:**
```
Warning: Text content did not match. Server: "Loading..." Client: "10 products"
```

**Cause:** Server and client rendered different content.

**Solution:**
- **MOST COMMON:** Add `getServerSnapshot` to `useSyncExternalStore` (see State Management section)
- Ensure state is restored from `window.__INITIAL_DATA__` before hydration
- Don't use `Math.random()`, `Date.now()`, etc. in render
- Use `useEffect` for browser-only code

### 2. Router Not Matching

**Error:**
```
Cannot read property 'handler' of null
```

**Cause:** Routes not registered on server.

**Solution:**
- Ensure `router.addRoute()` is called in `main-server.tsx`
- Routes must be identical to client routes

### 3. Store State Not Persisting

**Error:** Empty product list on hydration.

**Cause:** `window.__INITIAL_DATA__` not loaded.

**Solution:**
- Check `main.tsx` restores state before `hydrateRoot()`
- Verify state is serialized in `server.js`

### 4. SSG Pages Not Found

**Error:** 404 on `/product/123/`

**Cause:** Directory structure incorrect.

**Solution:**
- Ensure `static-site-generate.js` creates `/product/123/index.html`
- Not `/product/123.html`

### 5. Build Errors (Module Not Found)

**Error:**
```
Error: Cannot find module 'react-dom/server'
```

**Cause:** Missing `@types/react-dom` or wrong Node.js version.

**Solution:**
```bash
pnpm install --save-dev @types/react-dom
node --version  # Should be >=22
```

---

## Summary

### Declarative React Approach

Unlike vanilla's imperative string building, React SSR is **declarative**:

**Vanilla:**
```javascript
function ProductCard(product) {
  return `
    <div class="product-card">
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p>${product.price}원</p>
    </div>
  `;
}
```

**React:**
```tsx
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.title} />
      <h3>{product.title}</h3>
      <p>{product.price}원</p>
    </div>
  );
}
```

### Key Takeaways

1. **Universal Router**: Create router instance OUTSIDE components based on environment
2. **renderToString**: Server-side React rendering is one function call
3. **getServerSnapshot (CRITICAL)**: Add third parameter to `useSyncExternalStore` for SSR support
4. **TypeScript Types**: Define `window.__INITIAL_DATA__` in global.d.ts for type safety
5. **State Initialization**: Pre-populate stores on server, serialize to `window.__INITIAL_DATA__`
6. **Hydration**: Use `hydrateRoot()` instead of `createRoot()` on client
7. **SSG**: Run server render at build time for all routes
8. **Isolation**: Reset store state for each SSR request to prevent memory leaks
9. **Testing**: Verify CSR, SSR, and SSG all pass the same tests

### Next Steps

Refer to `SSR_SSG_TODO_CHECKLIST.md` for step-by-step implementation tasks.
