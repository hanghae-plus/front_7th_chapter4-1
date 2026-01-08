# 🚀 심화과제 (React SSR/SSG) 구현 계획

> 이 문서는 심화과제(React SSR/SSG) 구현을 위한 상세 계획입니다.
> Vanilla 구현 경험과 가이드 문서를 바탕으로 작성되었습니다.

---

## 📌 목표

1. **renderToString을 이용하여 SSR 진행하기**
2. **renderToString을 이용하여 SSG 진행하기**
3. **Universal (Client와 Server에서 모두 실행 가능한) React 코드 작성하기**
4. **안전한 Hydration**

---

## ✅ 체크리스트 (PR 템플릿 기반)

### React SSR

- [ ] `renderToString`을 이용하여 서버사이드에서 App 렌더링
- [ ] Universal React Router (서버/클라이언트 분기)
- [ ] React 상태관리 서버 초기화
- [ ] TypeScript SSR 모듈 빌드

### React Hydration

- [ ] Hydration 불일치 방지
- [ ] 클라이언트 상태 복원
- [ ] `window.__INITIAL_DATA__` 스크립트 주입 및 복원
- [ ] 서버-클라이언트 데이터 일치

### Static Site Generation

- [ ] 동적 라우트 SSG (상품 상세 페이지들)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포

---

## 📋 구현 단계별 계획

### STEP 05: React SSR 구현

**목표**: React 앱을 서버에서 `renderToString`으로 렌더링하기

#### 1. Express SSR 서버 설정 (`packages/react/server.js`)

**참고 파일**: `packages/vanilla/server.js`

**구현 내용**:

- Express 서버 설정
- 개발/프로덕션 환경 분기
- Vite 미들웨어 설정 (개발 환경)
- 정적 파일 서빙 (프로덕션 환경)
- HTML 템플릿 치환 (`<!--app-html-->`, `<!--app-head-->`)
- `window.__INITIAL_DATA__` 스크립트 주입

**주요 변경 사항**:

- `renderToString` 사용 (이미 import되어 있음)
- `main-server.tsx`에서 `render` 함수 호출
- TypeScript 모듈 동적 import (Windows 환경 고려)

#### 2. React SSR 렌더링 (`packages/react/src/main-server.tsx`)

**참고 파일**: `packages/vanilla/src/main-server.js`

**구현 내용**:

```tsx
export async function render(url: string, query: Record<string, string>) {
  // 1. Store 초기화
  // 2. 라우트 매칭 (Universal Router 사용)
  // 3. 데이터 프리페칭
  // 4. React 컴포넌트 → HTML 문자열
  const html = renderToString(<App url={url} initialData={initialData} />);
  // 5. 메타 태그 생성
  // 6. 초기 데이터 추출
  return { html, head, initialData };
}
```

**주요 기능**:

- `renderToString`으로 React 컴포넌트를 HTML 문자열로 변환
- 서버 데이터 프리페칭 (`loadHomePageData`, `loadProductDetailData`)
- 서버 상태관리 초기화 (`productStore`, `cartStore`)
- 메타 태그 생성 (SEO)

#### 3. 서버 데이터 로딩 (`packages/react/src/ssr-data.ts` - 새로 생성)

**참고 파일**: `packages/vanilla/src/main-server.js`의 `prefetchData` 함수

**구현 내용**:

```tsx
export interface HomePageData {
  products: Product[];
  categories: Category[];
  totalCount: number;
}

export interface ProductDetailData {
  product: Product;
  relatedProducts: Product[];
}

export async function loadHomePageData(url: string, query: QueryPayload): Promise<HomePageData | null>;
export async function loadProductDetailData(productId: string): Promise<ProductDetailData | null>;
```

**주요 기능**:

- Mock API를 통한 데이터 로딩
- TypeScript 인터페이스 정의
- 에러 처리

#### 4. Universal Router 구현

**참고 파일**: `packages/react/src/router/router.ts`

**현재 상태**: `@hanghae-plus/lib`의 `Router` 클래스 사용

**구현 내용**:

- 서버 환경에서의 라우트 매칭 (메모리 기반)
- 클라이언트 환경에서의 라우트 매칭 (Browser API 기반)
- 환경 체크: `typeof window === "undefined"`

**주요 고려사항**:

- `@hanghae-plus/lib`의 Router가 서버 환경을 지원하는지 확인
- 필요시 서버 전용 Router 래퍼 구현

---

### STEP 06: React Hydration 구현

**목표**: 서버 렌더링된 React 앱에 클라이언트 JavaScript 연결하기

#### 1. Hydration 로직 (`packages/react/src/main.tsx`)

**참고 파일**: `packages/vanilla/src/main.js`

**현재 상태**: `createRoot` 사용 → `hydrateRoot`로 변경 필요

**구현 내용**:

```tsx
// 기존
createRoot(rootElement).render(<App />);

// 변경 후
const initialData = window.__INITIAL_DATA__;
if (initialData) {
  // Store 초기화
  initializeStore(initialData);
}
hydrateRoot(rootElement, <App />);
```

**주요 기능**:

- `hydrateRoot` 사용 (SSR HTML과 연결)
- `window.__INITIAL_DATA__`에서 초기 데이터 복원
- Store 초기화
- 초기 데이터 사용 후 메모리에서 삭제

#### 2. 타입 정의 (`packages/react/src/types.ts`)

**구현 내용**:

```tsx
declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
  }
}

export interface InitialData {
  products?: Product[];
  categories?: Category[];
  totalCount?: number;
  currentProduct?: Product;
  relatedProducts?: Product[];
}
```

#### 3. Hydration 불일치 방지

**주요 고려사항**:

- 시간/날짜: `suppressHydrationWarning` 사용 또는 클라이언트에서만 렌더링
- 랜덤 값: 서버에서 생성한 값 사용
- 브라우저 전용 API: 조건부 접근 또는 `useEffect` 사용
- `useEffect`는 hydration 완료 후 실행됨을 인지

---

### STEP 07: React SSG 구현

**목표**: React 앱의 모든 페이지를 빌드 시점에 정적 HTML로 생성하기

#### 1. SSG 스크립트 (`packages/react/static-site-generate.js`)

**참고 파일**: `packages/vanilla/static-site-generate.js`

**구현 내용**:

```javascript
async function generateStaticSite() {
  // 1. 빌드된 서버 모듈 import
  const { render } = await import("./dist/react-ssr/main-server.js");

  // 2. 템플릿 읽기
  const template = fs.readFileSync("../../dist/react/index.html", "utf-8");

  // 3. 라우트 수집
  const routes = await getRoutes();

  // 4. 각 라우트마다 HTML 생성
  for (const route of routes) {
    await generatePage(route, template, render);
  }
}
```

**주요 기능**:

- 라우트 수집 (`getRoutes`)
  - 정적 라우트: `/`
  - 동적 라우트: `/product/:id/` (items.json에서 추출)
- 페이지 생성 (`generatePage`)
  - `renderToString`으로 HTML 생성
  - `window.__INITIAL_DATA__` 주입
  - 파일 저장 (경로: `/product/:id/` → `product/:id/index.html`)

#### 2. 빌드 스크립트 설정 (`packages/react/package.json`)

**확인 사항**:

- `build:client`: 클라이언트 번들 생성
- `build:server`: SSR 모듈 생성 (`--ssr src/main-server.tsx`)
- `build:ssg`: 클라이언트 + 서버 빌드 후 SSG 스크립트 실행
- `preview:ssg`: SSG 결과물 프리뷰

**현재 상태 확인 필요**:

- `build:client-for-ssg`: 올바른 출력 디렉토리 설정 (`../../dist/react`)
- `preview:ssg`: 올바른 base path 설정

---

## 📁 작업 대상 파일 목록

### 수정 필요 파일

1. **`packages/react/server.js`**
   - Express SSR 서버 구현
   - 템플릿 치환 로직
   - `main-server.tsx` import 및 호출

2. **`packages/react/src/main-server.tsx`**
   - `render` 함수 구현
   - `renderToString` 사용
   - 데이터 프리페칭
   - 메타 태그 생성

3. **`packages/react/src/main.tsx`**
   - `createRoot` → `hydrateRoot` 변경
   - 초기 데이터 복원 로직

4. **`packages/react/static-site-generate.js`**
   - SSG 스크립트 구현
   - 라우트 수집 및 페이지 생성

5. **`packages/react/src/types.ts`** (새로 생성 또는 수정)
   - `InitialData` 인터페이스
   - `Window.__INITIAL_DATA__` 타입 정의

### 새로 생성 파일

1. **`packages/react/src/ssr-data.ts`**
   - 서버 데이터 로딩 함수
   - `loadHomePageData`, `loadProductDetailData`

2. **`packages/react/src/hydration.ts`** (선택사항)
   - Hydration 관련 유틸리티 함수
   - Store 초기화 로직

---

## 🔍 참고 자료

### 가이드 문서

- `mockdowns/advanced/05_react-ssr.md`: React SSR 구현 가이드
- `mockdowns/advanced/06_react-hydration.md`: React Hydration 구현 가이드
- `mockdowns/advanced/07_react-ssg.md`: React SSG 구현 가이드

### Vanilla 구현 참고

- `packages/vanilla/server.js`: Express SSR 서버 구조
- `packages/vanilla/src/main-server.js`: 서버 렌더링 로직
- `packages/vanilla/src/main.js`: Hydration 로직
- `packages/vanilla/static-site-generate.js`: SSG 스크립트

### 기존 React 코드

- `packages/react/src/App.tsx`: 메인 앱 컴포넌트
- `packages/react/src/router/router.ts`: Router 설정
- `packages/react/src/pages/`: 페이지 컴포넌트들

---

## ⚠️ 주의사항

### 1. TypeScript 설정

- SSR 모듈은 ESM 형식으로 빌드되어야 함
- `vite.config.ts`의 SSR 빌드 설정 확인 필요
- Windows 환경에서 절대 경로 import 시 `pathToFileURL` 사용

### 2. 서버/클라이언트 분기

- `typeof window === "undefined"`로 서버 환경 체크
- 서버에서 사용 불가한 Hook: `useEffect`, `useLayoutEffect`
- 브라우저 전용 API 접근 시 조건부 처리

### 3. Hydration 불일치 방지

- 서버와 클라이언트의 초기 렌더링 결과가 일치해야 함
- 시간/날짜, 랜덤 값 등 동적 콘텐츠 주의
- `suppressHydrationWarning` 사용 시 신중하게

### 4. 빌드 순서

- 반드시 `build:client` → `build:server` → SSG 스크립트 순서로 실행
- SSG 스크립트는 빌드된 모듈을 사용하므로 순서 중요

### 5. 기존 코드 수정 제한

- 기본 구현 코드는 수정하지 않음 (과제 규칙)
- SSR/SSG 관련 파일만 수정/생성

---

## ✅ 완료 확인 방법

### 각 단계별 확인

1. **React SSR**:

   ```bash
   pnpm run build:server
   pnpm run dev:ssr
   # View Page Source → React 컴포넌트가 렌더링된 HTML 확인
   ```

2. **React Hydration**:

   ```bash
   pnpm run dev:ssr
   # 콘솔에 Hydration 경고 없음
   # 버튼 클릭 등 이벤트 정상 동작
   ```

3. **React SSG**:
   ```bash
   pnpm run build:ssg
   # dist/react/products/*.html 파일들 생성 확인
   pnpm run preview:ssg
   ```

### 최종 테스트

```bash
pnpm run test:e2e:advanced
```

---

## 📅 예상 작업 순서

1. **STEP 05: React SSR** (우선순위 1)
   - Express 서버 설정
   - `main-server.tsx` 구현
   - 서버 데이터 로딩 함수 구현
   - Universal Router 설정

2. **STEP 06: React Hydration** (우선순위 2)
   - `main.tsx` 수정 (hydrateRoot)
   - 초기 데이터 복원
   - Hydration 불일치 방지

3. **STEP 07: React SSG** (우선순위 3)
   - SSG 스크립트 구현
   - 빌드 스크립트 확인
   - 테스트 통과 확인

---

## 🔗 관련 이슈/참고

- Vanilla SSR/SSG 구현 완료 (참고: `mockdowns/after/00_completed-works.md`)
- PR 템플릿: `.github/pull_request_template.md`
- 과제 규칙: `.cursor/rules/global-rules.mdc`

---

**작성일**: 2025-01-XX  
**작성자**: AI Assistant  
**상태**: 계획 완료, 구현 대기 중
