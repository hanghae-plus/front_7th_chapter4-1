# SSR/SSG 학습 Q&A

이 문서는 SSR/SSG 구현 과정에서 나온 질문과 답변을 정리한 것입니다.

---

## Step 1: server.js

### 코드 흐름

**1. createServer() 시작**

**2. 환경별 설정**

| 개발 환경 (!prod) | 프로덕션 환경 (prod) |
|------------------|---------------------|
| Vite 서버 생성 (middlewareMode) | compression 미들웨어 적용 |
| Express에 Vite 미들웨어 연결 | sirv로 정적 파일 서빙 |
| - | 템플릿/render 함수 미리 로드 |

**3. 모든 요청 처리 (app.use "\*all")**

```
요청 들어옴
    ↓
[개발 환경만]
    ├── index.html 읽기
    ├── vite.transformIndexHtml() → HMR 스크립트 주입
    └── vite.ssrLoadModule() → 모듈 동적 로드
    ↓
render(url) 호출
    ↓
{ html, head, initialData } 반환
    ↓
템플릿 치환
    ├── <!--app-head--> → head
    ├── <!--app-html--> → html
    └── </head> 앞에 __INITIAL_DATA__ 삽입
    ↓
응답 전송
```

### 핵심 포인트

| 코드 | 역할 |
|------|------|
| `vite.ssrLoadModule("/src/main-server.js")` | 개발 중 파일 변경 시 자동 리로드 |
| `vite.transformIndexHtml(url, template)` | HMR 클라이언트 스크립트 주입 |
| `window.__INITIAL_DATA__` | 서버 → 클라이언트 데이터 전달 (Hydration용) |

### 왜 이렇게 해야 하나요? (이론)

#### SSR의 본질: "서버에서 HTML을 완성해서 보내자"

**CSR (현재 방식)의 문제점:**
```
브라우저 요청 → 서버가 빈 HTML 전송 → JS 다운로드 → JS 실행 → API 호출 → 화면 렌더링
                    ↑
            <div id="root"></div>  ← 텅 비어있음!
```

**문제:**
1. 검색 엔진 크롤러가 빈 페이지를 봄 (SEO 불리)
2. JS 로드 전까지 사용자는 흰 화면을 봄 (느린 초기 로딩)

**SSR (목표)의 해결책:**
```
브라우저 요청 → 서버가 완성된 HTML 전송 → 화면 즉시 표시 → JS 로드 → 인터랙티브
                    ↑
            <div id="root">
              <div class="product-list">...</div>  ← 이미 내용이 있음!
            </div>
```

---

#### 왜 개발/프로덕션 환경을 나누나요?

| 개발 환경 | 프로덕션 환경 |
|----------|--------------|
| 코드 수정 → 즉시 반영 (HMR) | 최적화된 번들 사용 |
| 소스 파일 그대로 사용 | 빌드된 파일 사용 |
| 빠른 개발 사이클 | 빠른 로딩 속도 |

---

#### 왜 `vite.ssrLoadModule()`을 사용하나요?

| `import()` | `vite.ssrLoadModule()` |
|------------|------------------------|
| 파일을 한 번 로드하면 캐시됨 | 파일 변경 시 새로 로드 (HMR) |
| 수정해도 서버 재시작 필요 | 수정 즉시 반영 |

**즉, 개발 중 코드를 수정하면 서버 재시작 없이 바로 반영됩니다!**

---

#### 왜 `transformIndexHtml()`이 필요하나요?

```html
<!-- 변환 전 (원본 index.html) -->
<script type="module" src="/src/main.js"></script>

<!-- 변환 후 -->
<script type="module" src="/src/main.js"></script>
<script type="module" src="/@vite/client"></script>  <!-- HMR 클라이언트 주입! -->
```

**HMR 클라이언트가 주입되어야 개발 중 코드 변경 시 브라우저가 자동 새로고침됩니다.**

---

#### 왜 `<!--app-html-->`을 치환하나요?

**index.html (템플릿):**
```html
<head>
  <!--app-head-->
</head>
<body>
  <div id="root"><!--app-html--></div>
</body>
```

**치환 후:**
```html
<head>
  <title>상품명 - 쇼핑몰</title>
  <script>window.__INITIAL_DATA__ = {...}</script>
</head>
<body>
  <div id="root">
    <div class="product-list">
      <div class="product-card">아이폰</div>
      ...
    </div>
  </div>
</body>
```

**이제 HTML 자체에 내용이 있으므로 JS 없이도 화면이 보입니다!**

---

#### 왜 `__INITIAL_DATA__`가 필요하나요?

**문제 상황:**
1. 서버에서 API 호출 → 데이터로 HTML 생성
2. 브라우저에서 JS 로드 → 또 API 호출? (중복!)

**해결:**
```
서버: API 호출 → HTML 생성 + 데이터를 __INITIAL_DATA__에 저장
브라우저: __INITIAL_DATA__가 있으면 API 호출 스킵!
```

---

### Q&A

#### Q1. compression이 뭔가요?

HTTP 응답을 **gzip/brotli로 압축**해서 보내는 Express 미들웨어입니다.

```
압축 없이:
서버 → [HTML 100KB] → 브라우저

compression 사용:
서버 → [HTML 100KB] → 압축 → [gzip 20KB] → 브라우저 → 압축 해제
```

**효과:** 네트워크 전송량 감소 → 페이지 로딩 속도 향상

---

#### Q2. sirv가 뭔가요?

**정적 파일 서빙** 미들웨어입니다. (`express.static`과 비슷하지만 더 빠름)

```javascript
app.use(base, sirv("./dist/vanilla", { extensions: [] }));
```

이 코드는:
- `/front_7th_chapter4-1/vanilla/` 경로로 요청이 오면
- `./dist/vanilla/` 폴더에서 파일을 찾아서 응답

```
요청: GET /front_7th_chapter4-1/vanilla/assets/main.js
응답: ./dist/vanilla/assets/main.js 파일 전송
```

---

#### Q3. 왜 상단에서 import 하지 않고 `await import()` 동적 임포트를 사용하나요?

```javascript
// 상단 import (정적)
import compression from "compression";  // ❌ 사용 안 함

// 동적 import
const compression = (await import("compression")).default;  // ✅ 사용
```

**이유: 프로덕션에서만 필요한 모듈이기 때문**

| 개발 환경 (!prod) | 프로덕션 환경 (prod) |
|------------------|---------------------|
| Vite가 정적 파일 서빙 담당 | sirv가 정적 파일 서빙 |
| Vite가 HMR 담당 | compression으로 압축 필요 |
| compression, sirv 필요 없음 ❌ | compression, sirv 필요 ✅ |

**장점:**
1. 개발 환경에서 불필요한 모듈 로드 안 함 → 서버 시작 빨라짐
2. 조건부 로드 → 필요할 때만 메모리에 올림

---

## Step 2: ServerRouter

### 왜 ServerRouter가 필요한가요?

기존 클라이언트 Router (`src/lib/Router.js`)는 `window` 객체를 사용합니다:
- `window.addEventListener("popstate", ...)` - 브라우저 히스토리 이벤트
- `window.location.pathname` - 현재 URL
- `window.history.pushState(...)` - URL 변경

**서버(Node.js)에는 `window`가 없습니다!**

그래서 서버 전용 라우터가 필요합니다.

### 클라이언트 Router vs 서버 Router

| 기능 | 클라이언트 Router | 서버 Router |
|------|------------------|-------------|
| URL 가져오기 | `window.location` | 파라미터로 받음 |
| URL 패턴 매칭 | `addRoute()`, `#findRoute()` | `addRoute()`, `match()` |
| 네비게이션 | `push()`, `popstate` 이벤트 | 불필요 |
| 구독/알림 | `subscribe()`, `notify()` | 불필요 |

### 코드 흐름

**addRoute (라우트 등록)**
```
"/product/:id/"
    ↓ :param → paramNames 배열에 저장
paramNames = ["id"]
    ↓ :param → ([^/]+) 정규식으로 변환
"/product/([^/]+)/"
    ↓ 슬래시 이스케이프
"\\/product\\/([^/]+)\\/"
    ↓ 정규식 객체 생성
/^\/product\/([^/]+)\/$/
    ↓ routes Map에 저장
```

**match (라우트 매칭)**
```
"/product/123/?sort=price"
    ↓ 쿼리스트링 제거
"/product/123/"
    ↓ 등록된 라우트들 순회하며 정규식 매칭
pathname.match(/^\/product\/([^/]+)\/$/)
    ↓ 매칭 성공! 캡처 그룹 추출
match = ["/product/123/", "123"]
    ↓ paramNames와 매핑
params = { id: "123" }
    ↓ 결과 반환
{ handler: ProductDetailPage, params: { id: "123" }, path: "/product/:id/" }
```

### 핵심 포인트

| 코드 | 역할 |
|------|------|
| `path.replace(/:\w+/g, ...)` | `:id` 같은 파라미터를 정규식 캡처 그룹으로 변환 |
| `([^/]+)` | "슬래시가 아닌 문자 1개 이상" 매칭 |
| `match[index + 1]` | `match[0]`은 전체 매칭, `match[1]`부터 캡처 그룹 |

---

## Step 3: Mock API

### 왜 Mock API를 분리해야 하나요?

**현재 상황:**

`handlers.js`는 MSW(Mock Service Worker) 전용입니다:

```javascript
// handlers.js
http.get("/api/products", async ({ request }) => {
  // ... 데이터 처리 로직
  return HttpResponse.json(response);  // HTTP 응답 형태로 반환
});
```

MSW는 **브라우저의 `fetch` 요청을 가로채서** 응답합니다:
```
브라우저: fetch('/api/products')
    ↓
MSW: "어, /api/products 요청이네? 내가 가로챌게!"
    ↓
handlers.js 실행 → HttpResponse.json() 반환
```

**SSR에서의 문제:**

서버(Node.js)에서는 MSW가 동작하지 않습니다!

```
서버: "상품 데이터가 필요한데..."
    ↓
fetch('/api/products')?  ← 실제 서버가 없으니 실패!
MSW?  ← 브라우저에서만 동작!
```

**해결책: 함수로 분리**

데이터 처리 로직만 순수 함수로 빼면, 어디서든 호출 가능:

```javascript
// mockApi.js (새로 만들 파일)
export function mockGetProducts({ page, limit, ... }) {
  // 데이터 처리 로직
  return { products, pagination, filters };  // 그냥 객체 반환
}
```

이제:
- **브라우저 (CSR)**: MSW handlers에서 `mockGetProducts()` 호출
- **서버 (SSR)**: `main-server.js`에서 `mockGetProducts()` 직접 호출

```
[CSR]
브라우저 → fetch → MSW → mockGetProducts() → 응답

[SSR]
서버 → mockGetProducts() 직접 호출 → 데이터 획득 → HTML 생성
```

### 한 줄 요약

> **SSR에서 서버가 직접 데이터를 가져오려면, HTTP 없이 호출할 수 있는 함수가 필요!**

---

## Step 4: main-server.js

(구현 후 추가 예정)

---

## Step 5: Hydration

(구현 후 추가 예정)

---

## Step 6: SSG

(구현 후 추가 예정)

---

## 개념 관련

### withLifecycle을 SSR에서 어떻게 활용하나요?

현재 `HomePage`와 `ProductDetailPage`는 `withLifecycle`을 사용합니다:

```javascript
export const HomePage = withLifecycle(
  {
    onMount: () => {
      loadProductsAndCategories();  // 클라이언트에서 API 호출
    },
    ...
  },
  () => { /* 렌더링 함수 */ }
);
```

**핵심:** `onMount`는 **클라이언트에서만** 실행됩니다.

SSR에서는 이미 `initialData`로 데이터가 주입되어 있으므로, 클라이언트에서 중복 API 호출을 방지해야 합니다:

```javascript
onMount: () => {
  // SSR/SSG에서 이미 데이터가 있으면 API 호출 스킵!
  if (!window.__INITIAL_DATA__) {
    loadProductsAndCategories();
  }
}
```

---

### SSR vs CSR vs SSG 차이점은?

| 방식 | 서버 역할 | 클라이언트 역할 | 장점 | 단점 |
|------|----------|----------------|------|------|
| CSR | 빈 HTML + JS 번들 전송 | JS 실행 → DOM 생성 → fetch → 렌더링 | 서버 부하 적음 | 초기 로딩 느림, SEO 불리 |
| SSR | 데이터 fetch → HTML 생성 → 전송 | HTML 표시 → JS 로드 → Hydration | SEO 좋음, 빠른 FCP | 서버 부하, TTFB 증가 |
| SSG | 빌드 타임에 HTML 생성 → 정적 파일 서빙 | HTML 표시 → JS 로드 → Hydration | 가장 빠름, 서버 부하 없음 | 빌드 시간, 동적 콘텐츠 제한 |

---

### Hydration이란?

서버에서 렌더링된 HTML에 클라이언트 JavaScript가 **"생명을 불어넣는"** 과정입니다.

- 서버 HTML: 정적 (이벤트 핸들러 없음)
- Hydration 후: 동적 (클릭, 입력 등 이벤트 작동)

```
서버 렌더링 → 정적 HTML 전송 → 브라우저 표시 → JS 로드 → Hydration → 인터랙티브
```

---

### Vite SSR의 핵심 메서드들은?

| 메서드 | 역할 |
|--------|------|
| `createServer({ middlewareMode: true })` | Vite를 Express 미들웨어로 사용 |
| `vite.ssrLoadModule(path)` | ESM 모듈 동적 로드 (HMR 지원) |
| `vite.transformIndexHtml(url, html)` | HTML에 HMR 클라이언트 스크립트 주입 |
| `vite.ssrFixStacktrace(error)` | 에러 스택트레이스를 원본 소스 위치로 변환 |

---

*이 문서는 학습 과정에서 계속 업데이트됩니다.*
