# E2E-Basic 테스트 실패 명세서 및 해결 과정

## 📋 개요

- **작성일**: 2025-01-XX
- **테스트 파일**: `e2e/e2e-basic.spec.ts`
- **테스트 대상**: Vanilla JavaScript 프로젝트 (CSR, SSR, SSG)
- **실행 명령어**: `pnpm test:e2e:basic`
- **테스트 결과**: 40개 통과, 17개 실패

## 📊 테스트 결과 요약

### 통과한 테스트 (40개)
- 대부분의 CSR 테스트 통과
- 일부 SSR 테스트 통과
- SSG 테스트 일부 통과

### 실패한 테스트 (17개)
모든 실패 테스트는 **SSR 관련 테스트**입니다.

#### 실패한 테스트 목록

1. **CSR 테스트 (1개 실패)**
   - `http://localhost:5173/` - "페이지 접속 시 로딩 상태가 표시되고 상품 목록이 정상적으로 로드된다"

2. **SSR 개발 서버 (5174) 테스트 (9개 실패)**
   - `http://localhost:5174/` - SSR 초기 렌더링 검증 (2개)
   - `http://localhost:5174/` - SSR 검색 및 필터링 (3개)
   - `http://localhost:5174/` - SSR 상품 상세 페이지 (1개)
   - `http://localhost:5174/` - SSR SEO 및 메타데이터 (2개)

3. **SSR 프로덕션 서버 (4174) 테스트 (7개 실패)**
   - `http://localhost:4174/front_7th_chapter4-1/vanilla/` - SSR 초기 렌더링 검증 (2개)
   - `http://localhost:4174/front_7th_chapter4-1/vanilla/` - SSR 검색 및 필터링 (3개)
   - `http://localhost:4174/front_7th_chapter4-1/vanilla/` - SSR 상품 상세 페이지 (1개)
   - `http://localhost:4174/front_7th_chapter4-1/vanilla/` - SSR SEO 및 메타데이터 (2개)

## 🔍 실패 원인 분석

### 핵심 문제: HTML 플레이스홀더 치환 실패

SSR 서버가 HTML 템플릿의 플레이스홀더를 치환하지 못하고 있습니다.

#### 1. 플레이스홀더가 치환되지 않는 문제

**기대 동작**:
```html
<!-- 템플릿에서 -->
<div id="root"><!--app-html--></div>
<title><!--app-title--></title>
<!--app-head-->

<!-- SSR 후 -->
<div id="root">[렌더링된 HTML]</div>
<title>쇼핑몰 - 홈</title>
<script>window.__INITIAL_DATA__ = {...}</script>
```

**실제 동작**:
```html
<!-- SSR 후에도 플레이스홀더가 그대로 남아있음 -->
<div id="root"><!--app-html--></div>
<title><!--app-title--></title>
<!--app-head-->
```

#### 2. 구체적인 실패 케이스

##### 케이스 1: SSR 초기 렌더링 실패
```
Expected: bodyContent.toContain("총")
Received: bodyContent이 비어있거나 플레이스홀더만 존재
```

##### 케이스 2: window.__INITIAL_DATA__ 미포함
```
Expected: HTML에 window.__INITIAL_DATA__ 스크립트 포함
Received: <!--app-head--> 플레이스홀더만 존재
```

##### 케이스 3: 동적 Title 미설정
```
Expected: <title>쇼핑몰 - 홈</title>
Received: <title><!--app-title--></title>
```

##### 케이스 4: 검색/필터링 결과 미렌더링
```
Expected: bodyContent.toContain("3개")  // 검색 결과
Received: bodyContent이 비어있음
```

##### 케이스 5: 상품 상세 페이지 미렌더링
```
Expected: bodyContent.toContain("PVC 투명 젤리 쇼핑백")
Received: bodyContent이 비어있음
```

## 🔧 해결 과정 및 시도한 방법

### 시도 1: 템플릿 파일 경로 확인 및 수정

**문제**: 프로덕션 모드에서 잘못된 템플릿 파일을 읽고 있을 가능성

**시도한 변경**:
```javascript
// packages/vanilla/server.js
const templatePath = prod 
  ? path.join(__dirname, "dist/vanilla/index.html")  // 프로덕션
  : path.join(__dirname, "index.html");              // 개발
```

**결과**: 실패 - 여전히 치환 안됨

### 시도 2: 미들웨어 순서 조정

**문제**: 정적 파일 서빙 미들웨어가 HTML을 먼저 서빙하여 SSR이 실행되지 않음

**시도한 변경**:
```javascript
// SSR 미들웨어를 정적 파일 미들웨어보다 먼저 등록
app.use(base, ssrMiddleware);  // 먼저
app.use(base + "assets", sirv(...));  // 나중
```

**결과**: 부분적 개선 (개발 서버 5174에서는 일부 동작)

### 시도 3: sirv 미들웨어에서 index.html 제외

**문제**: `sirv`가 `index.html`을 직접 서빙하여 SSR 미들웨어가 실행되지 않음

**시도한 변경**:
```javascript
app.use(
  base + "assets",
  sirv(path.join(distPath, "assets"), {
    ignores: ["index.html"],  // index.html 제외
    dev: false,
  })
);
```

**결과**: 실패 - 여전히 치환 안됨

### 시도 4: base 경로 처리 로직 개선

**문제**: 프로덕션에서 `base` 경로(`/front_7th_chapter4-1/vanilla/`) 처리 로직 오류

**시도한 변경**:
```javascript
// URL 추출 로직 개선
let url;
if (prod) {
  url = req.originalUrl?.split("?")[0] || req.url?.split("?")[0] || "/";
  // base 경로 제거
  if (base && url.startsWith(base)) {
    url = url.slice(base.length);
  }
} else {
  url = req.url?.split("?")[0] || req.path || "/";
}
```

**결과**: 부분적 개선 (URL 파싱은 개선되었으나 여전히 치환 문제 존재)

### 시도 5: render 함수 반환값 확인

**문제**: `render` 함수가 올바른 결과를 반환하지 않을 가능성

**확인 내용**:
```javascript
// packages/vanilla/src/main-server.js
export const render = async (url, query) => {
  // ... 렌더링 로직
  return {
    html: renderedHtml,      // HTML 문자열
    initialState: {...},     // 초기 상태
    title: "쇼핑몰 - 홈"     // 페이지 제목
  };
};
```

**결과**: `render` 함수는 정상적으로 값을 반환하는 것으로 확인

### 시도 6: HTML 치환 로직 확인

**문제**: 치환 로직 자체에 오류가 있을 가능성

**확인 내용**:
```javascript
// packages/vanilla/server.js - ssrMiddleware 내부
let html = template;
html = html.replace("<!--app-html-->", finalAppHtml);
html = html.replace("<!--app-head-->", initialStateScript);
html = html.replace("<!--app-title-->", title);
```

**문제 발견**: 
- `replace()` 메서드는 첫 번째 일치 항목만 치환합니다.
- 하지만 템플릿에 각 플레이스홀더는 하나씩만 존재하므로 문제가 아닙니다.
- 실제 문제는 `render` 함수가 호출되지 않거나, 반환값이 올바르지 않을 가능성

### 현재 상태

**서버 코드 구조** (`packages/vanilla/server.js`):
```javascript
// 1. 정적 파일 서빙 (assets만)
if (prod) {
  app.use(base + "assets", sirv(...));
} else {
  app.use("/src", sirv(...));
  app.use("/public", sirv(...));
}

// 2. SSR 미들웨어
if (prod) {
  app.use(base, ssrMiddleware);  // base 경로 포함
} else {
  app.use(ssrMiddleware);  // base 경로 없음
}
```

**SSR 미들웨어 내부 로직**:
```javascript
const ssrMiddleware = async (req, res, next) => {
  // 1. 정적 파일 요청 스킵
  if (req.path.startsWith("/src/") || req.path.startsWith("/public/")) {
    return next();
  }

  // 2. API 요청 처리 (생략)

  // 3. render 함수 호출
  const renderResult = await render(url, query);
  
  // 4. HTML 치환
  let html = template;
  html = html.replace("<!--app-html-->", renderResult.html);
  html = html.replace("<!--app-head-->", initialStateScript);
  html = html.replace("<!--app-title-->", renderResult.title);
  
  // 5. 응답 전송
  res.send(html);
};
```

## 🎯 근본 원인 추정

### 추정 1: render 함수가 호출되지 않음

**증거**:
- 플레이스홀더가 그대로 남아있음 = 치환 코드가 실행되지 않았음
- `render` 함수가 호출되지 않았거나, 오류가 발생하여 `catch` 블록에서 처리되었을 가능성

**확인 방법**:
- `server.js`에 `console.log` 추가하여 `render` 호출 여부 확인
- 에러 로그 확인

### 추정 2: 템플릿 변수가 잘못된 파일 참조

**증거**:
- 개발 서버(5174)와 프로덕션 서버(4174) 모두에서 같은 문제 발생
- 하지만 개발 서버에서는 일부 동작한다는 이전 피드백

**확인 방법**:
- `templatePath` 변수 로그 출력
- `template` 변수 내용 확인 (`console.log(template.substring(0, 200))`)

### 추정 3: Express 미들웨어 실행 순서 문제

**증거**:
- 정적 파일 미들웨어가 SSR 미들웨어보다 먼저 실행되어 HTML을 직접 서빙
- 또는 `next()` 호출 누락으로 SSR 미들웨어가 실행되지 않음

**확인 방법**:
- 미들웨어 등록 순서 확인
- `next()` 호출 확인

## 📝 해결 방안

### 즉시 시도할 수 있는 방법

1. **디버깅 로그 추가**
   ```javascript
   const ssrMiddleware = async (req, res, next) => {
     console.log('[SSR] 요청 URL:', req.url);
     console.log('[SSR] template 존재:', !!template);
     console.log('[SSR] render 함수 존재:', !!render);
     
     try {
       const renderResult = await render(url, query);
       console.log('[SSR] render 결과:', {
         htmlLength: renderResult.html?.length,
         title: renderResult.title,
         hasInitialState: !!renderResult.initialState
       });
       // ... 치환 로직
     } catch (error) {
       console.error('[SSR] 에러:', error);
       // ...
     }
   };
   ```

2. **템플릿 파일 내용 확인**
   ```javascript
   console.log('[SSR] 템플릿 일부:', template.substring(0, 500));
   console.log('[SSR] 플레이스홀더 포함:', {
     appHtml: template.includes('<!--app-html-->'),
     appHead: template.includes('<!--app-head-->'),
     appTitle: template.includes('<!--app-title-->')
   });
   ```

3. **미들웨어 실행 순서 명확화**
   - 정적 파일 미들웨어를 SSR 미들웨어 **이후**에 등록
   - 또는 정적 파일 미들웨어에서 HTML 요청을 명시적으로 `next()`로 전달

4. **에러 처리 강화**
   ```javascript
   const ssrMiddleware = async (req, res, next) => {
     try {
       // ... 기존 로직
     } catch (error) {
       console.error('[SSR] 치명적 오류:', error);
       console.error('[SSR] 스택:', error.stack);
       // 에러 페이지 반환
       res.status(500).send('SSR 오류 발생');
     }
   };
   ```

### 장기적 해결 방안

1. **테스트 환경 구축**
   - SSR 서버 단위 테스트 작성
   - `render` 함수 단위 테스트 작성
   - 통합 테스트 작성

2. **코드 리팩토링**
   - SSR 미들웨어 로직 분리 및 모듈화
   - 에러 처리 표준화
   - 로깅 시스템 구축

3. **문서화**
   - SSR 동작 원리 문서화
   - 트러블슈팅 가이드 작성

## 🔄 다음 단계

1. ✅ 테스트 실행 및 실패 항목 분석 (완료)
2. ✅ 실패 원인 명세서 작성 (완료)
3. ⏳ 디버깅 로그 추가 및 실행
4. ⏳ 근본 원인 확인
5. ⏳ 수정 사항 적용
6. ⏳ 테스트 재실행 및 검증

## 📚 참고 자료

- `packages/vanilla/server.js`: Express SSR 서버 코드
- `packages/vanilla/src/main-server.js`: SSR 렌더링 로직
- `e2e/createTests.ts`: 테스트 코드
- `.cursor/docs/4174문제해결방안.md`: 이전 문제 해결 시도 기록

