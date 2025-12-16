# SSR 쿼리 파라미터 적용 디버깅 기록

## 문제 발견

### 실패한 테스트 (3개)
e2e:basic 테스트 실행 결과, 3개의 SSR 관련 테스트가 실패:

1. **검색 파라미터 SSR 테스트**
   - 예상: 9개 상품
   - 실제: 340개 상품

2. **카테고리 필터링 SSR 테스트**
   - 예상: 11개 상품
   - 실제: 340개 상품

3. **복합 필터링 SSR 테스트**
   - 예상: 9개 상품
   - 실제: 340개 상품

### 증상
쿼리 파라미터가 있는 요청에서도 필터링이 적용되지 않고 전체 상품(340개)이 반환됨.

---

## 원인 분석 과정

### 1단계: 데이터 검증
목 데이터를 확인한 결과, 실제로 필터링 조건에 맞는 데이터가 존재함을 확인:
- `생활/건강` + `자동차용품`: 11개 존재
- `search=냄새`: 9개 존재

### 2단계: SSR 로직 확인
`main-server.js`의 `render()` 함수에 디버깅 로그 추가:

```javascript
console.log("[SSR] Rendering:", { url, query });
console.log("[SSR] Final state before return:");
console.log("  productState.totalCount:", productState.totalCount);
```

**결과**: SSR에서는 정확히 11개로 계산됨!

### 3단계: HTTP 응답 확인
```bash
curl "http://localhost:4174/?category1=생활/건강&category2=자동차용품" | grep totalCount
```

**결과**: `"totalCount":340` - 340개가 반환됨

**핵심 발견**: SSR은 올바르게 11개를 계산하지만, HTTP 응답에는 340개가 포함됨.

### 4단계: 근본 원인 파악

#### 문제점 1: SSG가 placeholder를 교체함
```html
<!-- SSG 이전의 index.html -->
<div id="root"><!--app-html--></div>

<!-- SSG 이후의 index.html -->
<div id="root"><div>... 340개 상품 HTML ...</div></div>
```

SSG가 `index.html`을 생성할 때 `<!--app-html-->` placeholder를 교체하여, SSR에서 사용할 템플릿에 placeholder가 없음.

#### 문제점 2: 정적 파일이 우선 반환됨
`express.static`이 모든 `/` 요청에 대해 `index.html`을 반환하여, 쿼리 파라미터가 있어도 SSR로 넘어가지 않음.

---

## 시도했던 해결 방법들

### ❌ 시도 1: 라우트 등록 위치 변경
라우트를 `render()` 함수 내부에서 모듈 레벨로 이동.

**결과**: 문제 해결 안됨.

### ❌ 시도 2: SSG에서 홈페이지 생성 제거
SSG에서 홈페이지 생성을 제거하여 placeholder 보존 시도.

**사용자 피드백**:
> "아니 왜 ssg에서 홈페이지 생성을 제거하는거지? 이게 말이 된다고 생각해?"

**문제점**:
- SSG의 목적은 정적 HTML 생성으로 초기 로딩 속도 개선
- 홈페이지를 제거하면 모든 요청이 SSR로 가서 성능 저하
- 올바른 아키텍처: SSG로 기본 페이지 생성 + SSR로 동적 요청 처리

---

## 올바른 해결 방법

### 해결 전략
1. **SSG**: 쿼리 파라미터가 없는 기본 상태의 HTML 생성 (성능 최적화)
2. **SSR**: 쿼리 파라미터가 있는 동적 요청 처리 (필터링 적용)
3. **템플릿 분리**: SSR 전용 템플릿 생성 (placeholder 보존)

### 구현 세부사항

#### 1. SSR 전용 템플릿 생성 (`static-site-generate.js`)
```javascript
async function generateStaticSite() {
  const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

  // SSR용 템플릿 저장 (placeholder 보존)
  const ssrTemplatePath = "../../dist/vanilla/template.html";
  fs.writeFileSync(ssrTemplatePath, template);

  // 홈페이지 생성 (기본 상태)
  const { html: homeHtml, state: homeState, meta: homeMeta } = await render("/", {});
  let homeResult = template
    .replace("<!--app-html-->", homeHtml)
    .replace("<!--app-head-->", stateScript);

  fs.writeFileSync("../../dist/vanilla/index.html", homeResult);
}
```

**핵심**:
- `template.html`: SSR용 (placeholder 보존)
- `index.html`: SSG로 생성된 정적 파일 (placeholder 교체됨)

#### 2. SSR에서 template.html 사용 (`server.js`)
```javascript
if (prod) {
  // SSR용 템플릿 (플레이스홀더 보존된 파일)
  template = fs.readFileSync(
    path.resolve(__dirname, "../../dist/vanilla/template.html"),
    "utf-8"
  );
  render = (await import("./dist/vanilla-ssr/main-server.js")).render;
}
```

#### 3. 조건부 정적 파일 서빙 (`server.js`)
```javascript
const staticMiddleware = express.static(
  path.resolve(__dirname, "../../dist/vanilla"),
  {
    index: false,  // 자동 index.html 반환 비활성화
    fallthrough: true,
  }
);

app.use(base, (req, res, next) => {
  const normalizedPath = req.path.replace(new RegExp(`^${base}`), "/");

  // 쿼리 파라미터가 있으면 SSR로 넘김
  if (normalizedPath === "/" && Object.keys(req.query).length > 0) {
    return next();  // SSR 핸들러로 이동
  }

  // 쿼리가 없으면 정적 index.html 반환
  if (normalizedPath === "/") {
    return res.sendFile(path.resolve(__dirname, "../../dist/vanilla/index.html"));
  }

  // 그 외 정적 파일 서빙
  staticMiddleware(req, res, next);
});
```

**로직**:
1. `/` 요청 + 쿼리 있음 → SSR 처리
2. `/` 요청 + 쿼리 없음 → 정적 `index.html` 반환
3. 그 외 경로 → 정적 파일 서빙

#### 4. 쿼리 객체 변환 (`server.js`)
```javascript
// req.query는 [Object: null prototype]이므로 일반 객체로 변환
const query = { ...req.query };
const { html: appHtml, state, meta } = await render(url, query);
```

#### 5. 상태 격리 보장 (`src/lib/ServerRouter.js`)
```javascript
match(url, query = {}) {
  // 쿼리를 명시적으로 복사하여 독립적인 객체로 설정
  this.#currentQuery = { ...query };
  // ...
}
```

#### 6. 모듈 레벨 라우트 등록 (`src/main-server.js`)
```javascript
// 라우트 등록 (모듈 레벨에서 한 번만 실행)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

export const render = async (url, query = {}) => {
  // Store 초기화 (매 요청마다 깨끗한 상태로 시작)
  productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: {...} });
  cartStore.dispatch({ type: "RESET", payload: { items: [] } });

  const route = router.match(url, query);
  // ...
}
```

---

## 테스트 결과

### Before
```
Tests:  3 failed, 54 passed, 57 total
```

실패한 테스트:
- 검색 파라미터 SSR 테스트
- 카테고리 필터링 SSR 테스트
- 복합 필터링 SSR 테스트

### After
```
Tests:  57 passed, 57 total
Time:   9.4s
```

**모든 테스트 통과! ✅**

### 검증
```bash
# 쿼리 파라미터 없음 - 정적 파일 반환
curl "http://localhost:4174/" | grep totalCount
# 결과: "totalCount":340

# 쿼리 파라미터 있음 - SSR 처리
curl "http://localhost:4174/?category1=생활/건강&category2=자동차용품" | grep totalCount
# 결과: "totalCount":11 ✅
```

---

## 핵심 교훈

### 1. SSG와 SSR의 역할 구분
- **SSG**: 빌드 타임에 정적 HTML 생성 (성능 최적화)
- **SSR**: 런타임에 동적 요청 처리 (개인화/필터링)
- 둘은 **상호 보완적**이며, 하나를 제거하는 것이 아니라 **적절히 분리**해야 함

### 2. 템플릿 관리
- SSG가 placeholder를 교체한 파일을 SSR 템플릿으로 사용할 수 없음
- SSR 전용 템플릿을 별도로 유지해야 함

### 3. Express 미들웨어 순서
- `express.static`의 `index` 옵션 주의
- 조건부 로직으로 정적 파일 vs SSR 분기 처리

### 4. 상태 관리
- SSR 환경에서는 매 요청마다 Store 초기화 필수
- 쿼리 객체 등 상태는 명시적으로 복사하여 격리

---

## 변경된 파일 목록

1. `server.js` - 조건부 정적 파일 서빙 및 template.html 사용
2. `static-site-generate.js` - template.html 생성 로직 추가
3. `src/main-server.js` - 모듈 레벨 라우트 등록 및 Store 초기화
4. `src/lib/ServerRouter.js` - 쿼리 객체 명시적 복사
5. `src/router/withLifecycle.js` - 서버 환경에서 watches 실행 방지
6. `src/pages/HomePage.js` - 디버깅 로그 제거

---

## 커밋 정보

```
commit f84df11
Author: hansejun
Date: 2025-12-17

fix: SSR에서 쿼리 파라미터 적용되도록 템플릿 분리 및 미들웨어 수정

5 files changed, 82 insertions(+), 30 deletions(-)
```

---

## 참고 자료

- Express Static Middleware: https://expressjs.com/en/starter/static-files.html
- SSR vs SSG: https://nextjs.org/docs/pages/building-your-application/rendering
- Express Middleware Order: https://expressjs.com/en/guide/using-middleware.html
