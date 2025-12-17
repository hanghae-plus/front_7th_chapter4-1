# React SSR & SSG Implementation Checklist

> 이 체크리스트는 React 프로젝트에 SSR과 SSG를 구현하기 위한 단계별 작업 목록입니다.
> 각 작업을 완료하면 체크박스를 표시하고, 구현 과정에서 발견한 이슈나 메모를 기록하세요.

## 📋 Overview

**목표:** React 프로젝트에 SSR(Server-Side Rendering)과 SSG(Static Site Generation)를 구현하여 `pnpm run test:e2e:advanced` 테스트를 통과시킵니다.

**핵심 원칙:**
- ✅ 서버/클라이언트 환경 분기는 **컴포넌트 외부**에서 처리
- ✅ 선언적(declarative) 방식으로 구현
- ✅ Hydration mismatch 방지
- ✅ 매 SSR 요청마다 state 격리 보장

---

## Phase 1: 프로젝트 구조 및 환경 설정

### 1.1 Dependencies 확인 및 설치

- [x] **1.1.1** Node.js 버전 확인 (>= 22)
  ```bash
  node --version
  ```
  - **Acceptance Criteria:** Node.js 22 이상 설치됨
  - **Notes:** ✅ v22.20.0 확인

- [x] **1.1.2** 필요한 패키지 확인
  ```bash
  # package.json에 다음 패키지들이 있는지 확인
  # - react-dom (latest)
  # - @types/react-dom (devDependencies)
  # - express
  # - @types/node
  ```
  - **Acceptance Criteria:** 필요한 모든 패키지가 설치됨
  - **Notes:** ✅ 모든 패키지 확인됨

- [x] **1.1.3** TypeScript 설정 확인
  - `tsconfig.json`에 `"types": ["vite/client", "node"]` 포함되어 있는지 확인
  - **Acceptance Criteria:** TypeScript가 Node.js 타입을 인식함
  - **Notes:** ✅ tsconfig.app.json 확인

### 1.2 프로젝트 구조 이해

- [x] **1.2.1** vanilla 프로젝트의 SSR 구조 분석
  - `packages/vanilla/server.js` 읽기
  - `packages/vanilla/src/main-server.js` 읽기
  - `packages/vanilla/src/lib/ServerRouter.js` 읽기
  - `packages/vanilla/static-site-generate.js` 읽기
  - **Acceptance Criteria:** vanilla 프로젝트의 SSR/SSG 플로우를 이해함
  - **Notes:** ✅ Vanilla 구조 분석 완료

- [x] **1.2.2** React 프로젝트의 현재 구조 파악
  - `src/main.tsx` (클라이언트 엔트리) 확인
  - `src/App.tsx` 구조 확인
  - `src/router/router.ts` 확인
  - `src/entities/products/productStore.ts` 확인 (useSyncExternalStore 사용)
  - `src/entities/carts/cartStore.ts` 확인
  - **Acceptance Criteria:** React 프로젝트의 현재 아키텍처를 이해함
  - **Notes:** ✅ React 구조 분석 완료

### 1.3 TypeScript Global Type 정의 (CRITICAL)

- [x] **1.3.1** `src/types/global.d.ts` 파일 생성
  ```typescript
  declare global {
    interface Window {
      __INITIAL_DATA__?: {
        products: Product[];
        categories: Categories;
        totalCount: number;
        product: ProductState;
        cart: CartState;
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
  - **Acceptance Criteria:** TypeScript가 `window.__INITIAL_DATA__` 인식함
  - **Reference:** `SSR_SSG_IMPLEMENTATION_GUIDE.md` - Build Configuration 섹션
  - **Notes:** ✅ global.d.ts 생성 완료 (commit: 92b4b3d)

- [x] **1.3.2** `tsconfig.json`에 global types 포함 확인
  ```json
  {
    "include": [
      "src/**/*",
      "src/types/global.d.ts"
    ]
  }
  ```
  - **Acceptance Criteria:** global.d.ts가 컴파일에 포함됨
  - **Notes:** ✅ tsconfig.app.json의 include: ["src"]에 자동 포함됨, pnpm run tsc 통과

---

## Phase 2: Universal Router 구현

> **의존성:** Phase 1 완료
> **핵심:** 서버/클라이언트 라우터를 컴포넌트 **외부**에서 선택

### 2.1 ServerRouter 구현

- [x] **2.1.1** `packages/lib/src/ServerRouter.ts` 생성
  - window 의존성 없는 순수 URL 매칭 클래스 구현
  - `addRoute(path, handler)` 메서드
  - `match(url, query)` 메서드
  - `get query()`, `get params()`, `get route()` 게터
  - Client API 호환용 no-op 메서드들 (`subscribe`, `push`, `start`)
  - **Acceptance Criteria:** ServerRouter가 서버 환경에서 URL 매칭을 수행함
  - **Reference:** `SSR_SSG_IMPLEMENTATION_GUIDE.md` - Universal Router Pattern 섹션
  - **Notes:** ✅ ServerRouter.ts 생성 완료

- [x] **2.1.2** ServerRouter 타입 정의
  - Router와 동일한 인터페이스 제공
  - Generic 타입 `<Handler>` 지원
  - **Acceptance Criteria:** TypeScript 타입 에러 없음
  - **Notes:** ✅ Generic<Handler> 타입 지원, pnpm run tsc 통과

- [x] **2.1.3** ServerRouter export
  - `packages/lib/src/index.ts`에 ServerRouter export 추가
  - **Acceptance Criteria:** 다른 패키지에서 import 가능
  - **Notes:** ✅ lib/index.ts에 export 추가 완료

### 2.2 Router Factory 생성

- [x] **2.2.1** `src/router/createRouter.ts` 생성
  ```tsx
  // CRITICAL: 환경 분기는 모듈 레벨에서 한 번만
  export const router = typeof window === 'undefined'
    ? new ServerRouter<FunctionComponent>(BASE_URL)
    : new Router<FunctionComponent>(BASE_URL);
  ```
  - **Acceptance Criteria:** 서버/클라이언트에서 올바른 라우터 인스턴스 생성됨
  - **Notes:** ✅ createRouter.ts 생성, typeof window 분기 구현

- [x] **2.2.2** `src/router/index.ts` 업데이트
  - `export { router } from './createRouter';` 추가
  - 기존 exports 유지
  - **Acceptance Criteria:** 기존 코드가 영향받지 않음
  - **Notes:** ✅ router/index.ts 업데이트 완료

### 2.3 Route 등록

- [x] **2.3.1** `src/App.tsx` 또는 별도 파일에서 라우트 등록
  ```tsx
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);
  ```
  - **Acceptance Criteria:** 서버/클라이언트 모두 같은 라우트 정의 사용
  - **Notes:** ✅ App.tsx에 이미 라우트 등록됨 (/, /product/:id/, .*)

- [x] **2.3.2** 라우트 등록이 서버/클라이언트에서 모두 실행되는지 확인
  - **Acceptance Criteria:** 라우트가 양쪽 환경에서 정상 작동
  - **Notes:** ✅ Universal Router 패턴으로 양쪽 환경 지원

---

## Phase 3: Server-Side Rendering 구현

> **의존성:** Phase 2 완료
> **핵심:** React `renderToString`으로 서버에서 HTML 생성

### 3.1 main-server.tsx 구현

- [x] **3.1.1** `src/main-server.tsx` 파일 생성
  - `renderToString` from `react-dom/server` import
  - `createElement` from `react` import
  - **Acceptance Criteria:** 파일 생성 및 기본 imports 완료
  - **Notes:** ✅ main-server.tsx 생성, imports 완료

- [x] **3.1.2** serverFetch 유틸리티 구현
  - `getProducts(params)`: 목 데이터에서 상품 목록 조회
  - `getProduct(productId)`: 상품 상세 조회
  - `getRelatedProducts(product)`: 관련 상품 조회
  - `getCategories()`: 카테고리 목록 조회
  - **Acceptance Criteria:** 서버에서 fetch API 없이 목 데이터 접근 가능
  - **Reference:** `packages/vanilla/src/main-server.js` 참고
  - **Notes:** ✅ serverFetch 객체 구현 완료

- [x] **3.1.3** `render(url, query)` 함수 구현 - Store 초기화
  ```tsx
  // 1. Store 리셋 (매 요청마다 깨끗한 상태)
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: initialProductState,
  });
  cartStore.dispatch({
    type: CART_ACTIONS.CLEAR_CART,
    payload: undefined,
  });
  ```
  - **Acceptance Criteria:** 매 SSR 요청마다 store가 초기화됨
  - **Notes:** ✅ productStore.dispatch SETUP, cartStore.dispatch CLEAR_CART

- [x] **3.1.4** `render(url, query)` 함수 구현 - 라우트 매칭
  ```tsx
  // 2. ServerRouter로 URL 매칭
  const route = router.match(url, query);
  ```
  - **Acceptance Criteria:** 서버에서 올바른 라우트 매칭됨
  - **Notes:** ✅ router.match(url, query) 구현

- [x] **3.1.5** `render(url, query)` 함수 구현 - 데이터 프리페칭
  ```tsx
  // 3. 라우트별 데이터 로드
  if (route.path === "/") {
    // Homepage: products + categories
  } else if (route.path === "/product/:id/") {
    // Product detail: product + related products
  }
  ```
  - **Acceptance Criteria:** 각 라우트에 필요한 데이터가 store에 로드됨
  - **Notes:** ✅ 홈페이지(products+categories), 상품상세(product+related) 프리페칭

- [x] **3.1.6** `render(url, query)` 함수 구현 - React 렌더링
  ```tsx
  // 4. React 컴포넌트 렌더링
  const PageComponent = route.handler;
  const html = renderToString(createElement(PageComponent));
  ```
  - **Acceptance Criteria:** React 컴포넌트가 HTML 문자열로 변환됨
  - **Notes:** ✅ renderToString(createElement(PageComponent))

- [x] **3.1.7** `render(url, query)` 함수 구현 - 메타 태그 생성
  ```tsx
  // 5. 메타 정보 생성
  let meta = {
    title: "쇼핑몰 - 홈",
    description: "항해플러스 프론트엔드 쇼핑몰",
  };
  // 상품 상세 페이지의 경우 동적 메타 태그
  ```
  - **Acceptance Criteria:** SEO를 위한 메타 정보 생성됨
  - **Notes:** ✅ meta.title, meta.description 동적 생성

- [x] **3.1.8** `render(url, query)` 함수 구현 - 상태 반환
  ```tsx
  // 6. HTML과 state 반환
  return {
    html,
    state: {
      products: productState.products,
      categories: productState.categories,
      product: productState,
      cart: cartState,
      route: { url, query, params: route.params },
    },
    meta,
  };
  ```
  - **Acceptance Criteria:** 클라이언트에서 사용할 초기 상태 직렬화됨
  - **Notes:** ✅ html, state, meta 반환 구현 완료

### 3.2 server.js 구현

- [x] **3.2.1** `server.js` 파일 생성 (또는 기존 파일 업데이트)
  - Express app 초기화
  - base path 설정 (production: `/front_7th_chapter4-1/react/`)
  - **Acceptance Criteria:** Express 서버 기본 설정 완료
  - **Reference:** `packages/vanilla/server.js` 참고
  - **Notes:** ✅ Express app, port, base path 설정 완료

- [x] **3.2.2** 개발 환경 Vite 미들웨어 설정
  ```javascript
  if (!prod) {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    app.use(vite.middlewares);
  }
  ```
  - **Acceptance Criteria:** 개발 환경에서 Vite HMR 작동
  - **Notes:** ✅ Vite middleware 통합 완료

- [x] **3.2.3** 프로덕션 환경 정적 파일 서빙 설정
  ```javascript
  const staticMiddleware = express.static(
    path.resolve(__dirname, "../../dist/react"),
    { index: false, fallthrough: true }
  );
  app.use(base, (req, res, next) => {
    // 쿼리 파라미터 있으면 SSR로 넘김
    if (normalizedPath === "/" && Object.keys(req.query).length > 0) {
      return next();
    }
    // ...
  });
  ```
  - **Acceptance Criteria:** 정적 파일과 SSR이 올바르게 분기됨
  - **Notes:** ✅ 조건부 정적 파일 서빙 구현 (쿼리 파라미터 분기)

- [x] **3.2.4** SSR 핸들러 구현
  ```javascript
  app.get(/.*/, async (req, res) => {
    // 1. URL과 query 파싱
    // 2. 템플릿과 render 함수 로드 (dev/prod 분기)
    // 3. render(url, query) 호출
    // 4. HTML 조립 (state 주입, meta 태그)
    // 5. 응답
  });
  ```
  - **Acceptance Criteria:** 모든 경로에서 SSR이 작동함
  - **Notes:** ✅ SSR handler 구현 (template 로드, render 호출, HTML 조립)

- [x] **3.2.5** 에러 처리 구현
  ```javascript
  catch (error) {
    if (!prod && vite) {
      vite.ssrFixStacktrace(error);
    }
    console.error("SSR Error:", error.stack);
    res.status(500).end(error.stack);
  }
  ```
  - **Acceptance Criteria:** 에러 발생 시 적절한 응답 반환
  - **Notes:** ✅ try-catch 에러 처리 및 vite.ssrFixStacktrace 구현

- [ ] **3.2.6** 서버 시작 및 테스트
  ```bash
  pnpm run dev:ssr
  # http://localhost:5176 접속
  ```
  - **Acceptance Criteria:** 서버가 시작되고 페이지가 로드됨
  - **Notes:**

### 3.3 HTML 템플릿 업데이트

- [x] **3.3.1** `index.html`에 placeholder 추가
  ```html
  <head>
    <!-- ... -->
    <!--app-head-->
  </head>
  <body>
    <div id="root"><!--app-html--></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
  ```
  - **Acceptance Criteria:** SSR HTML이 주입될 위치 표시됨
  - **Notes:** ✅ placeholders 이미 존재, SEO meta tags (title, description) 추가

### 3.4 SSR 동작 확인

- [ ] **3.4.1** 개발 서버에서 SSR 테스트
  ```bash
  pnpm run dev:ssr
  # http://localhost:5176/ 방문
  ```
  - 페이지 소스 보기: `<div id="root">` 안에 렌더링된 HTML이 보여야 함
  - **Acceptance Criteria:** 서버에서 렌더링된 HTML 확인
  - **Notes:**

- [ ] **3.4.2** 쿼리 파라미터 테스트
  - `http://localhost:5176/?search=노트북` 접속
  - 페이지 소스에 검색 결과가 포함되어 있어야 함
  - **Acceptance Criteria:** 쿼리 파라미터가 SSR에 반영됨
  - **Notes:**

- [ ] **3.4.3** 상품 상세 페이지 테스트
  - `http://localhost:5176/product/[상품ID]/` 접속
  - 페이지 소스에 상품 정보 포함 확인
  - **Acceptance Criteria:** 동적 라우트 SSR 작동
  - **Notes:**

---

## Phase 4: Hydration 구현

> **의존성:** Phase 3 완료
> **핵심:** 서버 렌더링된 HTML을 클라이언트에서 인터랙티브하게 만들기

### 4.0 useStore Hook 수정 (CRITICAL - 먼저 해야 함!)

- [x] **4.0.1** `packages/lib/src/hooks/useStore.ts`에 `getServerSnapshot` 추가
  ```tsx
  export const useStore = <T, S = T>(
    store: Store<T>,
    selector: (state: T) => S = defaultSelector<T, S>
  ) => {
    const shallowSelector = useShallowSelector(selector);

    // CRITICAL: 세 번째 인자 getServerSnapshot 추가!
    return useSyncExternalStore(
      store.subscribe,
      () => shallowSelector(store.getState()),
      () => shallowSelector(store.getState()) // Server snapshot
    );
  };
  ```
  - **Acceptance Criteria:** React 18 SSR에서 hydration 경고 없음
  - **Reference:** `SSR_SSG_IMPLEMENTATION_GUIDE.md` - State Management 섹션
  - **Notes:** ✅ useSyncExternalStore에 세 번째 파라미터 getServerSnapshot 추가 완료

  **⚠️ WARNING:** 이 작업을 하지 않으면:
  - Hydration mismatch 에러 발생
  - 서버/클라이언트 렌더링 불일치
  - E2E 테스트 실패

  **✅ COMPLETED - 이 CRITICAL 작업이 완료되어 안전하게 진행 가능합니다!**

### 4.1 main.tsx 업데이트

- [ ] **4.1.1** `hydrateRoot` import
  ```tsx
  import { hydrateRoot } from "react-dom/client";
  ```
  - **Acceptance Criteria:** hydrateRoot 함수 import 완료
  - **Notes:**

- [ ] **4.1.2** 초기 상태 복원 로직 추가
  ```tsx
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
  ```
  - **Acceptance Criteria:** SSR 상태가 클라이언트 store에 복원됨
  - **Notes:**

- [ ] **4.1.3** 클라이언트 라우터 시작
  ```tsx
  router.start();
  ```
  - **Acceptance Criteria:** 클라이언트 라우터가 초기화됨
  - **Notes:**

- [ ] **4.1.4** `createRoot` → `hydrateRoot` 변경
  ```tsx
  // Before: createRoot(rootElement).render(<App />);
  // After:
  hydrateRoot(rootElement, <App />);
  ```
  - **Acceptance Criteria:** Hydration 사용
  - **Notes:**

### 4.2 Hydration 테스트

- [ ] **4.2.1** Hydration mismatch 체크
  - 브라우저 콘솔에서 hydration 관련 경고 확인
  - 경고가 있다면 서버/클라이언트 렌더링 차이 수정
  - **Acceptance Criteria:** Hydration 경고 없음
  - **Notes:**

- [ ] **4.2.2** 인터랙티브 기능 테스트
  - 검색창 입력 테스트
  - 카테고리 필터링 테스트
  - 상품 클릭 → 상세 페이지 이동 테스트
  - 장바구니 추가 테스트
  - **Acceptance Criteria:** 모든 인터랙션이 정상 작동
  - **Notes:**

- [ ] **4.2.3** 네트워크 없이 네비게이션 테스트
  - 페이지 로드 후 개발자 도구에서 네트워크 오프라인 설정
  - 페이지 간 이동이 SPA처럼 작동하는지 확인
  - **Acceptance Criteria:** 클라이언트 라우팅이 작동함
  - **Notes:**

### 4.3 상태 복원 검증

- [ ] **4.3.1** productStore 복원 확인
  - 페이지 로드 시 `productStore.getState()` 출력
  - 서버에서 프리페칭한 데이터와 일치하는지 확인
  - **Acceptance Criteria:** 상품 데이터가 복원됨
  - **Notes:**

- [ ] **4.3.2** cartStore 복원 확인
  - localStorage에 장바구니 데이터가 있다면 복원되는지 확인
  - **Acceptance Criteria:** 장바구니 상태가 복원됨
  - **Notes:**

---

## Phase 5: Static Site Generation (SSG) 구현

> **의존성:** Phase 3, 4 완료
> **핵심:** 빌드 타임에 모든 페이지를 정적 HTML로 생성

### 5.1 static-site-generate.js 구현

- [ ] **5.1.1** `static-site-generate.js` 파일 생성
  - Node.js 스크립트로 작성 (ES modules)
  - `fs`, `path` import
  - **Acceptance Criteria:** 파일 생성 및 기본 imports 완료
  - **Notes:**

- [ ] **5.1.2** 목 데이터 읽기
  ```javascript
  const mockProducts = JSON.parse(
    fs.readFileSync("./src/mocks/items.json", "utf-8")
  );
  ```
  - **Acceptance Criteria:** 모든 상품 데이터 로드됨
  - **Notes:**

- [ ] **5.1.3** 클라이언트 빌드 템플릿 읽기
  ```javascript
  const templatePath = "../../dist/react/index.html";
  const template = fs.readFileSync(templatePath, "utf-8");
  ```
  - **Acceptance Criteria:** 빌드된 HTML 템플릿 로드됨
  - **Notes:**

- [ ] **5.1.4** SSR 템플릿 복사 (placeholder 보존)
  ```javascript
  const ssrTemplatePath = "../../dist/react/template.html";
  fs.writeFileSync(ssrTemplatePath, template);
  ```
  - **Acceptance Criteria:** SSR용 템플릿이 별도 저장됨
  - **Notes:**

- [ ] **5.1.5** 서버 렌더 함수 import
  ```javascript
  const { render } = await import("./dist/react-ssr/main-server.js");
  ```
  - **Acceptance Criteria:** 빌드된 SSR 모듈 로드됨
  - **Notes:**

- [ ] **5.1.6** 홈페이지 생성
  ```javascript
  const { html: homeHtml, state: homeState, meta: homeMeta } =
    await render("/", {});

  let homeResult = template
    .replace("<!--app-html-->", homeHtml)
    .replace("<!--app-head-->", stateScript);

  // 메타 태그 주입
  // ...

  fs.writeFileSync("../../dist/react/index.html", homeResult);
  ```
  - **Acceptance Criteria:** 홈페이지 정적 HTML 생성됨
  - **Notes:**

- [ ] **5.1.7** 404 페이지 생성
  ```javascript
  fs.copyFileSync(
    "../../dist/react/index.html",
    "../../dist/react/404.html"
  );
  ```
  - **Acceptance Criteria:** 404.html 파일 생성됨
  - **Notes:**

- [ ] **5.1.8** 상품 상세 페이지 생성 (루프)
  ```javascript
  const productDir = "../../dist/react/product";
  fs.mkdirSync(productDir, { recursive: true });

  for (const product of mockProducts) {
    const { html, state, meta } =
      await render(`/product/${product.productId}/`, {});

    // HTML 조립
    // ...

    // /product/123/ 디렉토리 생성 및 index.html 저장
    const dir = path.join(productDir, product.productId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), productResult);
  }
  ```
  - **Acceptance Criteria:** 모든 상품 페이지가 정적 HTML로 생성됨
  - **Notes:**

- [ ] **5.1.9** 진행 상황 로깅
  ```javascript
  console.log(`✅ ${generatedCount} product pages generated`);
  ```
  - **Acceptance Criteria:** 생성된 페이지 수 출력
  - **Notes:**

- [ ] **5.1.10** 에러 처리
  ```javascript
  generateStaticSite().catch((error) => {
    console.error("❌ Static site generation failed:", error);
    process.exit(1);
  });
  ```
  - **Acceptance Criteria:** 에러 발생 시 빌드 실패
  - **Notes:**

### 5.2 Build Scripts 설정

- [ ] **5.2.1** `package.json` scripts 확인
  ```json
  {
    "build:client-for-ssg": "rm -rf ../../dist/react && vite build --outDir ../../dist/react",
    "build:server": "vite build --outDir ./dist/react-ssr --ssr src/main-server.tsx",
    "build:ssg": "pnpm run build:client-for-ssg && node static-site-generate.js",
    "build": "pnpm run build:client && pnpm run build:server && pnpm run build:ssg"
  }
  ```
  - **Acceptance Criteria:** SSG 빌드 스크립트 설정됨
  - **Notes:**

### 5.3 SSG 빌드 및 테스트

- [ ] **5.3.1** SSG 빌드 실행
  ```bash
  pnpm run build:ssg
  ```
  - 빌드 로그에서 생성된 페이지 수 확인
  - **Acceptance Criteria:** 빌드 성공, 모든 페이지 생성됨
  - **Notes:**

- [ ] **5.3.2** 생성된 파일 구조 확인
  ```
  dist/react/
  ├── index.html              # 홈페이지
  ├── template.html           # SSR 템플릿
  ├── 404.html               # 404 페이지
  ├── product/
  │   ├── productId1/
  │   │   └── index.html
  │   ├── productId2/
  │   │   └── index.html
  │   └── ...
  └── assets/
  ```
  - **Acceptance Criteria:** 디렉토리 구조가 예상대로 생성됨
  - **Notes:**

- [ ] **5.3.3** SSG 프리뷰 서버 실행
  ```bash
  pnpm run preview:ssg
  # http://localhost:4179/front_7th_chapter4-1/react/ 방문
  ```
  - **Acceptance Criteria:** 정적 사이트가 로드됨
  - **Notes:**

- [ ] **5.3.4** 정적 페이지 검증
  - 홈페이지 로드 속도 확인 (즉시 로드되어야 함)
  - 페이지 소스 보기: 완전한 HTML 확인
  - 네트워크 탭: 서버 요청 없이 HTML 로드 확인
  - **Acceptance Criteria:** 서버 없이 정적 파일만으로 페이지 표시
  - **Notes:**

- [ ] **5.3.5** 네비게이션 테스트
  - 홈페이지 → 상품 상세 페이지 클릭
  - URL 변경 확인
  - Hydration 후 SPA 네비게이션 작동 확인
  - **Acceptance Criteria:** 정적 페이지 간 이동 및 SPA 네비게이션 작동
  - **Notes:**

---

## Phase 6: TypeScript 빌드 설정

> **의존성:** Phase 3 완료
> **핵심:** SSR 모듈을 TypeScript로 빌드

### 6.1 Vite SSR 빌드 설정

- [ ] **6.1.1** `vite.config.ts` 확인
  - SSR 빌드를 위한 설정이 필요하면 추가
  - **Acceptance Criteria:** `vite build --ssr` 명령어가 작동함
  - **Notes:**

- [ ] **6.1.2** SSR 빌드 테스트
  ```bash
  pnpm run build:server
  ```
  - `dist/react-ssr/main-server.js` 파일 생성 확인
  - **Acceptance Criteria:** SSR 모듈 빌드 성공
  - **Notes:**

### 6.2 TypeScript 타입 체크

- [ ] **6.2.1** 타입 체크 실행
  ```bash
  pnpm run tsc
  ```
  - **Acceptance Criteria:** 타입 에러 없음
  - **Notes:**

- [ ] **6.2.2** `main-server.tsx` 타입 에러 수정
  - any 타입 제거
  - 적절한 타입 정의 추가
  - **Acceptance Criteria:** TypeScript strict mode 통과
  - **Notes:**

---

## Phase 7: 최종 테스트 및 검증

> **의존성:** Phase 2-6 모두 완료
> **핵심:** E2E 테스트 통과 및 수동 테스트

### 7.1 개별 환경 테스트

- [ ] **7.1.1** CSR (개발 환경) 테스트
  ```bash
  pnpm run dev
  # http://localhost:5175/ 방문
  ```
  - 모든 기능 정상 작동 확인
  - **Acceptance Criteria:** CSR 정상 작동
  - **Notes:**

- [ ] **7.1.2** SSR (개발 환경) 테스트
  ```bash
  pnpm run dev:ssr
  # http://localhost:5176/ 방문
  ```
  - 페이지 소스에 렌더링된 HTML 확인
  - Hydration 후 인터랙티브 확인
  - **Acceptance Criteria:** SSR 정상 작동
  - **Notes:**

- [ ] **7.1.3** CSR (프로덕션 환경) 테스트
  ```bash
  pnpm run preview:csr-with-build
  # http://localhost:4175/front_7th_chapter4-1/react/ 방문
  ```
  - **Acceptance Criteria:** 프로덕션 CSR 정상 작동
  - **Notes:**

- [ ] **7.1.4** SSR (프로덕션 환경) 테스트
  ```bash
  pnpm run preview:ssr-with-build
  # http://localhost:4176/front_7th_chapter4-1/react/ 방문
  ```
  - **Acceptance Criteria:** 프로덕션 SSR 정상 작동
  - **Notes:**

- [ ] **7.1.5** SSG (프로덕션 환경) 테스트
  ```bash
  pnpm run preview:ssg-with-build
  # http://localhost:4179/front_7th_chapter4-1/react/ 방문
  ```
  - **Acceptance Criteria:** SSG 정상 작동
  - **Notes:**

### 7.2 E2E 테스트

- [ ] **7.2.1** 모든 서버 시작
  ```bash
  pnpm run serve:test
  ```
  - 5개 서버가 모두 시작되는지 확인
  - **Acceptance Criteria:** 모든 서버 실행됨
  - **Notes:**

- [ ] **7.2.2** E2E 테스트 실행
  ```bash
  # 다른 터미널에서
  pnpm run test:e2e:advanced
  ```
  - **Acceptance Criteria:** 모든 테스트 통과 ✅
  - **Notes:**

### 7.3 성능 및 SEO 검증

- [ ] **7.3.1** Lighthouse 테스트 (SSR)
  - http://localhost:4176/front_7th_chapter4-1/react/ 에서 Lighthouse 실행
  - Performance, SEO 점수 확인
  - **Acceptance Criteria:** 좋은 성능 점수
  - **Notes:**

- [ ] **7.3.2** Lighthouse 테스트 (SSG)
  - http://localhost:4179/front_7th_chapter4-1/react/ 에서 Lighthouse 실행
  - SSR보다 더 빠른 FCP 확인
  - **Acceptance Criteria:** 매우 좋은 성능 점수
  - **Notes:**

- [ ] **7.3.3** 메타 태그 검증
  - 상품 상세 페이지 소스 보기
  - `<title>`과 `<meta name="description">` 동적으로 생성되는지 확인
  - **Acceptance Criteria:** SEO 메타 태그 동적 생성됨
  - **Notes:**

### 7.4 에러 시나리오 테스트

- [ ] **7.4.1** 존재하지 않는 상품 ID 접근
  - `/product/invalid-id/` 접속
  - 에러 메시지 또는 404 페이지 표시 확인
  - **Acceptance Criteria:** 적절한 에러 처리
  - **Notes:**

- [ ] **7.4.2** 잘못된 쿼리 파라미터
  - `/?category1=invalid&search=테스트` 접속
  - 에러 없이 빈 결과 또는 필터링된 결과 표시
  - **Acceptance Criteria:** 에러 없이 처리됨
  - **Notes:**

---

## Phase 8: 코드 정리 및 커밋

> **의존성:** Phase 7 완료
> **핵심:** 코드 리뷰, 정리, 버전 관리

### 8.1 코드 리뷰 및 리팩토링

- [ ] **8.1.1** 중복 코드 제거
  - serverFetch 로직 재사용 가능하도록 정리
  - 공통 유틸리티 함수 분리
  - **Acceptance Criteria:** DRY 원칙 준수
  - **Notes:**

- [ ] **8.1.2** 주석 및 문서 추가
  - 복잡한 로직에 주석 추가
  - JSDoc 추가
  - **Acceptance Criteria:** 코드 가독성 향상
  - **Notes:**

- [ ] **8.1.3** TypeScript 타입 개선
  - any 타입 제거
  - 적절한 Generic 타입 사용
  - **Acceptance Criteria:** 타입 안전성 향상
  - **Notes:**

- [ ] **8.1.4** 린트 및 포맷팅
  ```bash
  pnpm run lint:fix
  pnpm run prettier:write
  ```
  - **Acceptance Criteria:** 코드 스타일 일관성
  - **Notes:**

### 8.2 Git 커밋

- [ ] **8.2.1** Universal Router 커밋
  ```bash
  git add packages/lib/src/ServerRouter.ts packages/lib/src/index.ts
  git add packages/react/src/router/createRouter.ts
  git commit -m "feat: implement Universal Router pattern for SSR/CSR"
  ```
  - **Notes:**

- [ ] **8.2.2** SSR 구현 커밋
  ```bash
  git add packages/react/src/main-server.tsx
  git add packages/react/server.js
  git add packages/react/index.html
  git commit -m "feat: implement React SSR with renderToString"
  ```
  - **Notes:**

- [ ] **8.2.3** Hydration 구현 커밋
  ```bash
  git add packages/react/src/main.tsx
  git commit -m "feat: implement client-side hydration with state restoration"
  ```
  - **Notes:**

- [ ] **8.2.4** SSG 구현 커밋
  ```bash
  git add packages/react/static-site-generate.js
  git add packages/react/package.json
  git commit -m "feat: implement Static Site Generation for all routes"
  ```
  - **Notes:**

- [ ] **8.2.5** 빌드 설정 커밋
  ```bash
  git add packages/react/vite.config.ts
  git add packages/react/tsconfig.json
  git commit -m "chore: configure TypeScript SSR module build"
  ```
  - **Notes:**

---

## 🎉 완료 체크리스트

### 최종 확인 사항

- [ ] ✅ `pnpm run test:e2e:advanced` 모든 테스트 통과
- [ ] ✅ CSR (dev, prod) 정상 작동
- [ ] ✅ SSR (dev, prod) 정상 작동
- [ ] ✅ SSG (prod) 정상 작동
- [ ] ✅ Hydration 경고 없음
- [ ] ✅ 모든 라우트 SSR/SSG 지원
- [ ] ✅ 메타 태그 동적 생성
- [ ] ✅ 성능 최적화
- [ ] ✅ TypeScript 타입 에러 없음
- [ ] ✅ 린트 에러 없음
- [ ] ✅ Git 커밋 완료

---

## 📝 구현 노트 및 이슈 트래킹

### 발견된 이슈

| 날짜 | 이슈 | 해결 방법 | 상태 |
|------|------|----------|------|
|      |      |          |      |

### 성능 메트릭

| 환경 | FCP | LCP | TTI | 비고 |
|------|-----|-----|-----|------|
| CSR  |     |     |     |      |
| SSR  |     |     |     |      |
| SSG  |     |     |     |      |

### 학습 내용

-
-
-

---

## 🔗 참고 자료

- [SSR_SSG_IMPLEMENTATION_GUIDE.md](./SSR_SSG_IMPLEMENTATION_GUIDE.md) - 상세 구현 가이드
- [packages/vanilla/server.js](../vanilla/server.js) - Vanilla SSR 참고
- [React renderToString 공식 문서](https://react.dev/reference/react-dom/server/renderToString)
- [useSyncExternalStore 공식 문서](https://react.dev/reference/react/useSyncExternalStore)

---

**팁:**
- 한 번에 한 Phase씩 진행하세요
- 각 Phase가 완료되면 반드시 테스트하세요
- 막히는 부분이 있으면 vanilla 프로젝트를 참고하세요
- 에러가 발생하면 "구현 노트" 섹션에 기록하세요
