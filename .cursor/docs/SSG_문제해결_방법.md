# SSG 문제 해결 방법

## 문제 상황

SSG 빌드는 성공하지만 테스트가 실패하는 경우, 주로 다음과 같은 원인이 있습니다:

1. `main-server.js`의 `render` 함수가 `global.apiItems`를 참조하는데 SSG 빌드 시 설정되지 않음
2. `window.__INITIAL_DATA__`의 구조가 테스트가 기대하는 형식과 다름
3. 플레이스홀더 치환이 제대로 되지 않음

## 해결 방법

### 1. SSG 빌드 시 `global.apiItems` 설정

**문제**: `main-server.js`의 `render` 함수가 `global.apiItems`를 사용하는데, SSG 빌드 시 이 값이 설정되지 않아 에러 발생

**해결**: `static-site-generate.js`에서 `global.apiItems`를 설정

```javascript
// static-site-generate.js

// 상품 데이터 및 유틸리티 import
import items from "./src/mocks/items.json" with { type: "json" };
import { render } from "./src/main-server.js";
import { filterProducts } from "./src/utils/productFilter.js";
import { injectIntoTemplate } from "./src/utils/htmlUtils.js";

// SSG 빌드 시 global.apiItems 설정 (main-server.js에서 사용)
global.apiItems = items;
```

**위치**: `static-site-generate.js` 파일 상단, `render` 함수 import 이후

**이유**: 
- SSR 서버(`server.js`)에서는 서버 시작 시 `global.apiItems`를 설정하지만
- SSG 빌드는 별도의 Node.js 프로세스로 실행되므로 `global.apiItems`를 직접 설정해야 함
- `main-server.js`의 `render` 함수에서 `global.apiItems`를 참조하므로, SSG 빌드 전에 반드시 설정 필요

**에러 예시**:
```
Error: items.json이 비어있거나 유효하지 않습니다.
at render (file:///.../main-server.js:229:17)
```

이는 `global.apiItems`가 설정되지 않아 발생하는 에러입니다.

### 2. `initialState` 구조 확인

**테스트가 기대하는 형식**:
```javascript
{
  products: [...],        // 최상위 레벨
  categories: {...},      // 최상위 레벨
  totalCount: 340,        // 최상위 레벨
  productStore: {...},    // 클라이언트 호환성
  cartStore: {...},
  uiStore: {...}
}
```

**`main-server.js`에서 `initialState` 구성**:
```javascript
// 현재 스토어 상태를 initialState로 추출
const currentState = productStore.getState();
const cartState = cartStore.getState();
const uiState = uiStore.getState();

// 테스트가 기대하는 형식: 최상위 레벨에 products, categories, totalCount
// 클라이언트 호환성을 위해 productStore 구조도 유지
const initialState = {};

// 테스트 형식: 최상위 레벨에 직접 배치 (products가 첫 번째 속성이 되도록)
if (currentState.products !== undefined) initialState.products = currentState.products;
if (currentState.categories !== undefined) initialState.categories = currentState.categories;
if (currentState.totalCount !== undefined) initialState.totalCount = currentState.totalCount;

// 클라이언트 호환성을 위한 기존 구조도 유지
const productStoreState = {};
if (currentState.products !== undefined) productStoreState.products = currentState.products;
if (currentState.totalCount !== undefined) productStoreState.totalCount = currentState.totalCount;
if (currentState.categories !== undefined) productStoreState.categories = currentState.categories;
if (currentState.currentProduct !== undefined) productStoreState.currentProduct = currentState.currentProduct;
if (currentState.relatedProducts !== undefined) productStoreState.relatedProducts = currentState.relatedProducts;
if (currentState.loading !== undefined) productStoreState.loading = currentState.loading;
if (currentState.error !== undefined) productStoreState.error = currentState.error;
if (currentState.status !== undefined) productStoreState.status = currentState.status;

initialState.productStore = productStoreState;
initialState.cartStore = cartState;
initialState.uiStore = uiState;
```

**중요**: 
- `products`, `categories`, `totalCount`는 **최상위 레벨**에 있어야 테스트 통과
- `productStore` 안에도 동일한 데이터를 넣어 클라이언트 호환성 유지

### 3. `categories` 구조 확인

**올바른 형식**:
```javascript
{
  "생활/건강": {
    "생활용품": {},
    "주방용품": {},
    // ...
  },
  "디지털/가전": {
    "태블릿PC": {},
    "노트북": {}
  }
}
```

**`categoryUtils.js`의 `getUniqueCategories` 함수**:
```javascript
export function getUniqueCategories(items) {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) {
      categories[cat1] = {};
    }
    if (cat2 && !categories[cat1][cat2]) {
      categories[cat1][cat2] = {};  // 빈 객체로 설정
    }
  });

  return categories;
}
```

**중요**: `category2` 값은 **빈 객체 `{}`**로 설정해야 함 (문자열이 아님)

### 4. `injectIntoTemplate` 함수 사용

**위치**: `src/utils/htmlUtils.js`

**용도**: SSR/SSG에서 공통으로 사용하는 HTML 템플릿 치환 함수

**사용법**:
```javascript
import { injectIntoTemplate } from "./src/utils/htmlUtils.js";

const html = injectIntoTemplate(template, {
  html: renderResult.html,
  initialState: renderResult.initialState,
  title: renderResult.title || "쇼핑몰",
});
```

**플레이스홀더**:
- `<!--app-html-->`: 렌더링된 HTML
- `<!--app-head-->`: `window.__INITIAL_DATA__` 스크립트
- `<!--app-title-->`: 페이지 타이틀

**JSON 직렬화**:
- `JSON.stringify()`는 기본적으로 공백 없이 직렬화됨
- 테스트는 공백 없는 JSON 문자열을 기대함
- `JSON.stringify(initialState || {})` 형태로 사용 (indent 옵션 불필요)

## React 프로젝트 적용 방법

### 1. `static-site-generate.js` 수정

```javascript
// React 프로젝트의 static-site-generate.js

import items from "./src/mocks/items.json" with { type: "json" };
import { render } from "./src/main-server.jsx";  // 또는 .tsx

// SSG 빌드 시 global.apiItems 설정
global.apiItems = items;

// ... 나머지 코드
```

### 2. `main-server.jsx` (또는 `.tsx`) 확인

- `render` 함수가 `global.apiItems`를 사용하는지 확인
- `initialState` 구조가 테스트 형식과 일치하는지 확인

### 3. `htmlUtils.js` (또는 `.ts`) 확인

- `injectIntoTemplate` 함수가 올바르게 구현되어 있는지 확인
- 플레이스홀더 치환이 정규식으로 모든 발생을 치환하는지 확인

## 체크리스트

SSG 빌드 후 테스트 실패 시 확인 사항:

- [ ] `static-site-generate.js`에 `global.apiItems = items;` 설정되어 있는가?
- [ ] `main-server.js`의 `render` 함수가 `global.apiItems`를 사용하는가?
- [ ] `initialState`에 `products`, `categories`, `totalCount`가 최상위 레벨에 있는가?
- [ ] `categories` 구조가 `{ "카테고리1": { "카테고리2": {} } }` 형식인가?
- [ ] `injectIntoTemplate` 함수가 모든 플레이스홀더를 치환하는가?
- [ ] 빌드된 HTML에 `<!--app-html-->`, `<!--app-head-->`, `<!--app-title-->` 플레이스홀더가 남아있지 않은가?

## 참고 파일

- `packages/vanilla/static-site-generate.js`: SSG 빌드 스크립트
- `packages/vanilla/src/main-server.js`: SSR/SSG 렌더링 로직
- `packages/vanilla/src/utils/htmlUtils.js`: HTML 템플릿 유틸리티
- `packages/vanilla/src/utils/categoryUtils.js`: 카테고리 유틸리티
- `packages/vanilla/src/utils/serverDataUtils.js`: 서버 데이터 프리페칭 유틸리티

## 테스트 확인

SSG 빌드 후 다음 명령어로 확인:

```bash
# SSG 빌드
pnpm run build:ssg

# 빌드된 HTML 확인
cat dist/vanilla/index.html | grep -o 'window.__INITIAL_DATA__.*</script>'

# 플레이스홀더 확인 (없어야 함)
cat dist/vanilla/index.html | grep -E "(<!--app-html-->|<!--app-head-->|<!--app-title-->)"
```

## 주의사항

1. **CSR과 SSG의 차이**: CSR은 Vite가 직접 서빙하지만, SSG는 빌드 타임에 정적 HTML을 생성
2. **환경 변수**: SSG 빌드 시 `process.env.SSG_BUILD = "true"` 설정 필요
3. **템플릿 경로**: SSG는 빌드된 템플릿(`dist/vanilla/index.html`)을 우선 사용, 없으면 원본 사용
4. **MSW**: SSG 빌드 타임에 MSW 서버를 시작하여 `fetch` 요청을 intercept할 수 있음

