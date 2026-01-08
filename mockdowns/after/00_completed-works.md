# 📋 완료된 작업 산출물

> 이 문서는 사용자 요청으로 처리된 모든 작업 내용을 기록합니다.
> 앞으로의 작업 시 이 문서를 참고하여 일관성 있게 진행합니다.

---

## 📅 작업 이력

### 2025-01-XX - 기본과제 (Vanilla SSR/SSG) 구현

---

## ✅ 완료된 작업 목록

### 1. STEP 01: Express SSR 서버 구현

**완료 조건:**

- ✅ Express 서버 생성
- ✅ `index.html` 템플릿 읽기
- ✅ `<!--app-html-->` 치환
- ✅ `<!--app-head-->` 치환
- ✅ 개발/프로덕션 환경 분기

**구현 파일:**

- `packages/vanilla/server.js`

**주요 내용:**

- Vite 미들웨어 설정 (개발 환경)
- 정적 파일 서빙 (프로덕션 환경)
- HTML 템플릿 치환 로직
- 환경별 템플릿 경로 처리

---

### 2. STEP 02: 서버 사이드 렌더링 구현

**완료 조건:**

- ✅ 서버용 엔트리 파일 분리 (`main-server.js`)
- ✅ 서버에서 동작하는 Router 구현
- ✅ URL에 따라 올바른 페이지 렌더링
- ✅ 렌더링 결과를 HTML 문자열로 반환

**구현 파일:**

- `packages/vanilla/src/main-server.js`

**주요 내용:**

- `ServerRouter` 클래스 구현
- URL 기반 라우트 매칭
- 데이터 프리페칭 로직 (`prefetchData`)
- 페이지 컴포넌트 HTML 문자열 렌더링
- 메타 태그 생성 (`generateHead`)
- 초기 데이터 추출 (Hydration용)

**구현 세부사항:**

- 서버 라우터는 `ServerRouter` 클래스로 구현
- 정규식을 사용한 파라미터 매칭 (`:id` → `(\d+)`)
- Mock API를 통한 데이터 프리페칭
- 쿼리 파라미터 지원 (검색, 필터링, 정렬)
- 상품 상세 페이지의 관련 상품 로드

---

### 3. STEP 03: 클라이언트 Hydration 구현

**완료 조건:**

- ✅ `window.__INITIAL_DATA__` 스크립트 주입
- ✅ 클라이언트에서 초기 데이터 복원
- ✅ 서버-클라이언트 데이터 일치
- ✅ 이벤트 핸들러 정상 동작

**구현 파일:**

- `packages/vanilla/src/main.js`
- `packages/vanilla/server.js`

**주요 내용:**

- 서버에서 `window.__INITIAL_DATA__` 스크립트 주입
- 클라이언트에서 `restoreInitialData()` 함수로 데이터 복원
- `productStore`에 초기 데이터 주입
- 초기 데이터 사용 후 메모리에서 삭제

---

### 4. STEP 04: Static Site Generation (SSG) 구현

**완료 조건:**

- ✅ 모든 라우트 목록 정의
- ✅ 동적 라우트 생성 (상품 상세 페이지들)
- ✅ 각 라우트별 HTML 파일 생성
- ✅ 파일 시스템에 저장

**구현 파일:**

- `packages/vanilla/static-site-generate.js`
- `packages/vanilla/package.json` (빌드 스크립트 수정)

**주요 내용:**

- 빌드 시점에 모든 페이지의 HTML 파일 미리 생성
- 정적 라우트: 홈 페이지 (`/`)
- 동적 라우트: 모든 상품 상세 페이지 (`/product/:id/`)
- `render` 함수를 사용하여 서버 렌더링과 동일한 방식으로 HTML 생성
- `window.__INITIAL_DATA__` 주입 포함
- 파일 경로: `/product/85067212996/` → `product/85067212996/index.html`

**구현 세부사항:**

```javascript
// 라우트 수집
async function getRoutes() {
  const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  const staticRoutes = [{ url: "/", query: {} }];
  const productRoutes = items.map((item) => ({
    url: `/product/${item.productId}/`,
    query: {},
  }));
  return [...staticRoutes, ...productRoutes];
}

// 페이지 생성
async function generatePage(routeInfo, template) {
  const { render } = await import(pathToFileURL(serverModulePath).href);
  const { html, head, initialData } = await render(routeInfo.url, routeInfo.query || {});
  // HTML 조립 및 파일 저장
}
```

**해결한 문제들:**

1. **JSON Import 문제**: Node.js에서 `import ... assert { type: "json" }` 미지원 → `fs.readFileSync` + `JSON.parse` 사용
2. **Windows 경로 문제**: ESM `import()`에서 절대 경로는 `file://` URL 형식 필요 → `pathToFileURL` 사용

**구현 세부사항:**

```javascript
// 서버에서 주입
const initialDataScript = initialData
  ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")};</script>`
  : "";

// 클라이언트에서 복원
function restoreInitialData() {
  const initialData = window.__INITIAL_DATA__;
  if (initialData) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products || [],
        totalCount: initialData.totalCount || 0,
        categories: initialData.categories || {},
        currentProduct: initialData.currentProduct || null,
        relatedProducts: initialData.relatedProducts || [],
        loading: false,
        status: "done",
      },
    });
    delete window.__INITIAL_DATA__;
  }
}
```

---

### 4. 보안 및 에러 처리 개선

**작업 내용:**

#### 4.1 XSS 취약점 수정

- **문제**: `</script>` 문자열이 포함된 데이터가 XSS 유발 가능
- **해결**: `JSON.stringify(initialData).replace(/</g, "\\u003c")` 이스케이프 처리
- **위치**: `packages/vanilla/server.js`

#### 4.2 에러 처리 개선

- **문제**: 개발 환경에서 에러 정보 부족
- **해결**: 개발/프로덕션 환경 분기 처리
  - 개발: 상세 에러 스택 표시
  - 프로덕션: 간단한 에러 메시지만 표시
- **위치**: `packages/vanilla/server.js`

---

### 5. 버그 수정

#### 5.1 `query` 파라미터 사용 문제

- **문제**: `render(url, query)` 함수에서 `query` 파라미터가 사용되지 않음
- **해결**: `prefetchData(route, query)`에 쿼리 파라미터 전달 및 사용
- **위치**: `packages/vanilla/src/main-server.js`

**수정 내용:**

```javascript
// 이전
async function prefetchData(route) {
  // 하드코딩된 값 사용
  mockAPI("/api/products", { limit: 20, page: 1, sort: "price_asc" });
}

// 수정 후
async function prefetchData(route, query = {}) {
  const searchParams = {
    limit: parseInt(query.limit) || 20,
    page: parseInt(query.page ?? query.current) || 1,
    sort: query.sort || "price_asc",
    search: query.search || "",
    category1: query.category1 || "",
    category2: query.category2 || "",
  };
  mockAPI("/api/products", searchParams);
}
```

#### 5.2 `path-to-regexp` 에러 해결

- **문제**: Express 와일드카드 라우트 `app.get("*", ...)` 사용 시 `path-to-regexp` 에러
- **해결**:
  - `app.get("*", ...)` → `app.use(...)` 변경
  - Vite 미들웨어를 조건부로 처리하여 정적 파일만 Vite에 전달
- **위치**: `packages/vanilla/server.js`

**수정 내용:**

```javascript
// 이전
app.get("*", async (req, res) => { ... });

// 수정 후
app.use(async (req, res) => { ... });
// Vite 미들웨어 조건부 처리
app.use((req, res, next) => {
  if (req.path.startsWith("/src/") || req.path.startsWith("/@") || req.path.includes(".")) {
    vite.middlewares(req, res, next);
  } else {
    next();
  }
});
```

#### 5.3 `window is not defined` 에러 해결

- **문제**: 서버 렌더링 시 `createStorage` 함수에서 `window.localStorage` 접근으로 에러 발생
- **해결**: 서버 환경 체크 및 더미 스토리지 객체 사용
- **위치**: `packages/vanilla/src/lib/createStorage.js`

**수정 내용:**

```javascript
// getStorage 함수 분리하여 서버 환경 체크
const getStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.localStorage;
};

export const createStorage = (key, storage = null) => {
  const safeStorage = storage || getStorage();
  // ...
};
```

#### 5.4 `Router` 클래스 서버 안전성 개선

- **문제**: 서버 렌더링 시 `Router` 클래스가 `window` API 직접 참조로 에러 발생
- **해결**: 모든 `window` 접근 부분에 환경 체크 추가
- **위치**: `packages/vanilla/src/lib/Router.js`

**수정 내용:**

- 생성자: `window.addEventListener` 체크 추가
- `query`, `params` getter: 서버 환경에서는 빈 객체 반환
- `push`, `start`: 서버 환경에서는 아무 작업도 하지 않음
- `parseQuery`, `getUrl`: 서버 환경 체크 추가

#### 5.5 `withLifecycle` 서버 안전성 개선

- **문제**: 서버 렌더링 시 `onMount`가 실행되며 클라이언트 전용 API 호출
- **해결**: 서버 환경에서는 생명주기 함수 실행하지 않도록 처리
- **위치**: `packages/vanilla/src/router/withLifecycle.js`

**수정 내용:**

```javascript
// mount 함수에서 서버 환경 체크
const mount = (page) => {
  if (typeof window === "undefined") {
    return; // 서버에서는 실행하지 않음
  }
  // ...
};

// withLifecycle 반환 함수에서 서버 환경 체크
return (...args) => {
  if (typeof window === "undefined") {
    return page(...args); // 서버에서는 바로 페이지 함수 실행
  }
  // 클라이언트 로직...
};
```

#### 5.6 서버 렌더링 시 쿼리 파라미터 전달 문제 해결

- **문제**: 서버 렌더링 시 `HomePage`가 쿼리 파라미터를 받지 못해 검색 입력 필드가 빈 값
- **해결**: `serverQueryContext.js` 모듈 생성하여 서버 렌더링 시 쿼리 저장 및 전달
- **위치**:
  - `packages/vanilla/src/lib/serverQueryContext.js` (신규)
  - `packages/vanilla/src/main-server.js`
  - `packages/vanilla/src/pages/HomePage.js`

**수정 내용:**

```javascript
// serverQueryContext.js
let currentServerQuery = {};
export const setServerQuery = (query) => {
  currentServerQuery = query || {};
};
export const getServerQuery = () => {
  return currentServerQuery;
};

// main-server.js의 render 함수
setServerQuery(query);
const html = renderPageComponent(route.handler);
clearServerQuery();

// HomePage.js
const query = typeof window !== "undefined" ? router.query : getServerQuery();
```

#### 5.7 JSON 속성 순서 문제 해결

- **문제**: 테스트가 기대하는 JSON 속성 순서와 실제 생성 순서가 다름
- **해결**: 초기 데이터 객체의 속성 순서를 테스트 기대값에 맞게 변경
- **위치**: `packages/vanilla/src/main-server.js`

**수정 내용:**

```javascript
// 테스트 기대 순서: products, categories, totalCount
const initialData = {
  products: state.products,
  categories: state.categories,
  totalCount: state.totalCount,
  currentProduct: state.currentProduct,
  relatedProducts: state.relatedProducts,
};
```

---

### 6. 메타태그 수정

**작업 내용:**

- **문제**: 테스트에서 기대하는 메타태그 형식과 불일치
- **해결**: `<title>쇼핑몰 - 상품 목록</title>` → `<title>쇼핑몰 - 홈</title>`로 변경
- **위치**: `packages/vanilla/src/main-server.js`

---

## 🔧 주요 구현 패턴

### 서버/클라이언트 분기 처리

```javascript
// 환경 체크
const isServer = typeof window === "undefined";

// 서버 전용 코드
if (isServer) {
  // 서버에서만 실행
}

// 클라이언트 전용 코드
if (!isServer) {
  // 클라이언트에서만 실행
}
```

### 안전한 스토리지 접근

```javascript
// 항상 안전하게 접근
const storage =
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} };
```

### XSS 방지

```javascript
// 항상 이스케이프 처리
JSON.stringify(data).replace(/</g, "\\u003c");
```

---

## 📝 테스트 관련

### 테스트 실행 방법

- 기본과제 테스트: `pnpm run test:e2e:basic`
- 전체 E2E 테스트: `pnpm run test:e2e`

### 테스트 통과 조건

- `e2e-basic.spec.ts`의 모든 테스트는 **기본적으로 통과해야 함**
- 테스트 실패 시 → 구현 코드 수정 필수 (테스트 코드 수정 금지)

### 🎉 테스트 통과 현황 (2025-01-XX)

- ✅ **CSR 테스트**: 전체 통과
  - `http://localhost:5173/` (개발 환경)
  - `http://localhost:4173/front_7th_chapter4-1/vanilla/` (프로덕션 환경)

- ✅ **SSR 테스트**: 전체 통과
  - `http://localhost:5174/` (개발 환경)
  - `http://localhost:4174/front_7th_chapter4-1/vanilla/` (프로덕션 환경)
  - 초기 렌더링 검증
  - 검색/필터링 SSR 처리
  - 상품 상세 페이지 SSR
  - 메타태그 생성
  - `window.__INITIAL_DATA__` 주입

- ❌ **SSG 테스트**: 미구현으로 인해 실패
  - `http://localhost:4178/front_7th_chapter4-1/vanilla/`

---

## ⚠️ 주의사항

1. **서버 환경에서는 `window`, `localStorage`, `document` 등 사용 불가**
   - 모든 브라우저 API 사용 시 환경 체크 필요

2. **쿼리 파라미터는 서버에서도 처리해야 함**
   - URL 파라미터로 전달된 검색/필터링/정렬 정보 활용

3. **XSS 방지는 필수**
   - 사용자 입력이나 동적 데이터를 HTML에 주입할 때 반드시 이스케이프 처리

4. **테스트 코드는 절대 수정 금지**
   - 테스트 실패 시 구현 코드를 수정하여 통과시켜야 함

---

## 🔗 관련 파일

- `packages/vanilla/server.js` - Express SSR 서버
- `packages/vanilla/src/main-server.js` - 서버 렌더링 로직
- `packages/vanilla/src/main.js` - 클라이언트 Hydration
- `packages/vanilla/src/lib/createStorage.js` - 스토리지 추상화 (서버 안전)

---

---

### 7. 이벤트 위임 버그 수정 (2025-01-XX)

**문제:**

- 개발 환경(5173)에서 CSR 테스트 실패: `#quantity-increase` 클릭 후 `#quantity-input` 값이 업데이트되지 않음
- 프로덕션 환경(4173)에서는 정상 동작

**원인 분석:**

- `registerGlobalEvents()`가 한 번만 실행되며, 실행 시점에 `eventHandlers`에 등록된 이벤트 타입에 대해서만 리스너 등록
- 개발 환경에서 모듈 로딩 순서나 HMR 때문에 `addEvent()`가 `registerGlobalEvents()` 호출 이후에 실행될 경우 리스너가 등록되지 않음

**해결:**

- `addEvent()`에서 새로운 이벤트 타입이 추가될 때 즉시 리스너를 등록하도록 수정
- `registeredEventTypes` Set으로 이미 등록된 이벤트 타입 추적

**수정 파일:**

- `packages/vanilla/src/utils/eventUtils.js`

**수정 내용:**

```javascript
// 새로 추가된 이벤트 타입 추적
const registeredEventTypes = new Set();

// 특정 이벤트 타입에 대한 리스너 등록
const registerEventListener = (eventType) => {
  if (typeof document === "undefined" || registeredEventTypes.has(eventType)) {
    return;
  }
  document.body.addEventListener(eventType, handleGlobalEvents);
  registeredEventTypes.add(eventType);
};

// addEvent 함수에서 새 이벤트 타입 추가 시 즉시 리스너 등록
export const addEvent = (eventType, selector, handler) => {
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = {};
    // 새로운 이벤트 타입이 추가되면 즉시 리스너 등록
    registerEventListener(eventType);
  }
  eventHandlers[eventType][selector] = handler;
};
```

---

---

## 🚀 React SSR 작업 진행 중

### React SSR 초기 구현 (2025-01-XX)

#### 1. React SSR 서버 설정

- **파일**: `packages/react/server.js`
- **내용**: Express 서버 설정, Vite 미들웨어 통합, SSR 렌더링 함수 호출

#### 2. React SSR 렌더링 로직

- **파일**: `packages/react/src/main-server.tsx`
- **내용**: `renderToString`을 사용한 서버 렌더링, 메타 태그 생성, 초기 데이터 추출

#### 3. 서버 사이드 데이터 로딩

- **파일**: `packages/react/src/ssr-data.ts`
- **내용**: 홈 페이지 및 상품 상세 페이지 데이터 프리페칭

#### 4. 공통 라이브러리 서버 안전성 개선

##### 4.1 `packages/lib/src/Router.ts` 서버 안전성 개선

- **문제**: 서버 렌더링 시 `Router` 클래스가 `window` API 직접 참조로 에러 발생
- **해결**: 모든 `window` 접근 부분에 환경 체크 추가
- **위치**: `packages/lib/src/Router.ts`

**수정 내용:**

- 생성자: `window.addEventListener`, `document.addEventListener` 체크 추가
- `query`, `params` getter: 서버 환경에서는 빈 객체 반환
- `push`, `start`: 서버 환경에서는 아무 작업도 하지 않음
- `#findRoute`: 서버 환경에서는 url 파라미터 기반으로 라우트 매칭
- `parseQuery`, `getUrl` static: 서버 환경 체크 추가

**주요 변경사항:**

```typescript
// 생성자에서 서버 환경 체크
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    // ...
  });
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      // ...
    });
  }
}

// getter에서 서버 환경 체크
get query(): StringRecord {
  if (typeof window === "undefined") {
    return {};
  }
  return Router.parseQuery(window.location.search);
}

// 메서드에서 서버 환경 체크
push(url: string) {
  if (typeof window === "undefined") {
    return;
  }
  // ...
}
```

##### 4.2 `packages/lib/src/createStorage.ts` 서버 안전성 개선

- **문제**: 서버 렌더링 시 `createStorage` 함수에서 `window.localStorage` 접근으로 에러 발생
- **해결**: 서버 환경 체크 및 더미 스토리지 객체 사용
- **위치**: `packages/lib/src/createStorage.ts`

**수정 내용:**

```typescript
// getStorage 함수 분리하여 서버 환경 체크
const getStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.localStorage;
};

export const createStorage = <T>(key: string, storage?: Storage | null) => {
  const safeStorage = storage || getStorage();
  // ...
};
```

##### 4.3 `packages/react/src/utils/log.ts` 서버 안전성 개선

- **문제**: 서버 렌더링 시 `log.ts`에서 `window` 직접 접근으로 에러 발생
- **해결**: 모든 `window` 접근에 환경 체크 추가
- **위치**: `packages/react/src/utils/log.ts`

**수정 내용:**

```typescript
// 서버 환경에서는 window가 없으므로 조건부 처리
if (typeof window !== "undefined") {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  if (typeof window !== "undefined" && window.__spyCalls) {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
```

##### 4.4 `packages/react/src/main.tsx` Hydration 구현

- **문제**: SSR HTML에 클라이언트 JavaScript 연결 필요
- **해결**: `createRoot` → `hydrateRoot` 변경 및 초기 데이터 복원
- **위치**: `packages/react/src/main.tsx`

**수정 내용:**

```typescript
import { hydrateRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS } from "./entities";
import type { InitialData } from "./types";

function restoreInitialData() {
  const initialData: InitialData | undefined = window.__INITIAL_DATA__;

  if (initialData) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products || [],
        totalCount: initialData.totalCount || 0,
        categories: initialData.categories || {},
        currentProduct: initialData.currentProduct || null,
        relatedProducts: initialData.relatedProducts || [],
        loading: false,
        status: "done",
      },
    });

    delete window.__INITIAL_DATA__;
  }
}

function main() {
  restoreInitialData();
  router.start();

  const rootElement = document.getElementById("root")!;
  hydrateRoot(rootElement, <App />);
}
```

**주요 기능:**

- `hydrateRoot` 사용하여 SSR HTML과 클라이언트 JavaScript 연결
- `window.__INITIAL_DATA__`에서 서버 렌더링된 초기 데이터 복원
- Store 초기화 후 메모리에서 초기 데이터 삭제

##### 4.5 React SSG 구현

- **목표**: React 앱의 모든 페이지를 빌드 시점에 정적 HTML로 생성
- **위치**: `packages/react/static-site-generate.js`

**구현 내용:**

```javascript
// 라우트 수집
async function getRoutes() {
  const items = JSON.parse(fs.readFileSync("./src/mocks/items.json", "utf-8"));

  const staticRoutes = [{ url: "/", query: {} }];
  const productRoutes = items.map((item) => ({
    url: `/product/${item.productId}/`,
    query: {},
  }));

  return [...staticRoutes, ...productRoutes];
}

// 페이지 생성
async function generatePage(routeInfo, template) {
  const { render } = await import("./dist/react-ssr/main-server.js");
  const { html, head, initialData } = await render(routeInfo.url, routeInfo.query);

  // HTML 조립 및 파일 저장
  const html = template
    .replace("<!--app-html-->", html)
    .replace("<!--app-head-->", head)
    .replace("</head>", `<script>window.__INITIAL_DATA__ = ...</script></head>`);

  fs.writeFileSync(filePath, html, "utf-8");
}
```

**주요 기능:**

- 정적 라우트: `/` (홈 페이지)
- 동적 라우트: `/product/:id/` (items.json에서 상품 ID 추출)
- 빌드 시점에 모든 페이지를 정적 HTML로 생성 (341개)
- `window.__INITIAL_DATA__` 주입
- Windows 환경 지원 (pathToFileURL 사용)

**문제 해결:**

1. **`window is not defined` 에러**:
   - `main-server.tsx`에서 `entities` 전체 import 시 `router`가 로드되어 `window` 접근
   - 해결: `entities/products/productStore`에서 직접 import하여 router 로드 방지

2. **`PublicImage` 컴포넌트 `BASE_URL` 사용**:
   - `BASE_URL`이 `import.meta.env.PROD` 사용으로 SSG에서 문제 발생 가능
   - 해결: 서버 컴포넌트에서 `ServerImage` 컴포넌트 생성하여 직접 `<img>` 태그 사용

3. **SSG 빌드 스크립트 누락**:
   - `build:ssg` 스크립트에 `build:server` 단계 누락
   - 해결: `build:ssg` 스크립트에 `build:server` 추가

##### 4.6 GitHub Pages 배포 설정

- **목표**: SSG 방식으로 빌드된 정적 파일을 GitHub Pages에 배포
- **배포 URL**: https://jumoooo.github.io/front_7th_chapter4-1/

**구현 내용:**

1. **루트 index.html 생성**:
   - Vanilla/React 선택 페이지
   - 위치: 프로젝트 루트 `index.html`

2. **GitHub Actions 워크플로우**:
   - 위치: `.github/workflows/deploy.yml`
   - 자동 배포: `main` 브랜치 push 시 자동 실행
   - 빌드: Vanilla SSG + React SSG
   - 배포: `dist/` 폴더를 GitHub Pages에 배포

3. **배포 스크립트**:
   - `package.json`에 `build:ssg` 스크립트 추가
   - `package.json`에 `deploy` 스크립트 추가 (수동 배포용)

**배포 디렉토리 구조:**

```
dist/
├── index.html          # 루트 선택 페이지
├── vanilla/            # Vanilla SSG 빌드 결과
└── react/              # React SSG 빌드 결과
```

**주요 기능:**

- SSG 방식으로만 빌드 (SSR 서버 불필요)
- 자동 배포 (GitHub Actions)
- 수동 배포 지원 (`pnpm run deploy`)
- 현재 상태 유지 (테스트 통과, 린트 오류 없음)

---

## 📌 다음 단계

- [x] STEP 04: Static Site Generation (SSG) 구현 (Vanilla)
- [x] 이벤트 위임 버그 수정 (개발 환경 CSR 테스트 실패 문제 해결)
- [x] SSG 테스트 통과 확인 (Vanilla)
- [x] React SSR 기본 구현 완료
- [x] React SSR 서버 안전성 개선 (Router, createStorage, log, PageWrapper)
- [x] React Hydration 구현
- [x] React SSG 구현 (341개 페이지 생성 완료)
- [x] React SSR 테스트 통과 확인
- [x] React SSG 테스트 통과 확인
- [x] GitHub Pages 배포 설정 (SSG 방식)
