# 🟢 STEP 02: 서버 사이드 렌더링

## 📌 이 스텝의 목표

> 서버에서 실제 페이지 컴포넌트를 렌더링하고, 라우팅 처리하기

---

## 🎯 완료 조건

- [ ] 서버용 엔트리 파일 분리 (`main-server.js`)
- [ ] 서버에서 동작하는 Router 구현
- [ ] URL에 따라 올바른 페이지 렌더링
- [ ] 렌더링 결과를 HTML 문자열로 반환

---

## 🧠 핵심 개념

### 서버 렌더링 흐름

```
요청 (/products/1)
    ↓
서버 Router 매칭
    ↓
해당 페이지 컴포넌트 실행
    ↓
HTML 문자열 생성
    ↓
템플릿에 주입
    ↓
응답
```

### 클라이언트 vs 서버 엔트리

| 파일 | 역할 | 실행 환경 |
|-----|------|----------|
| `main.js` | 클라이언트 진입점 | 브라우저 |
| `main-server.js` | 서버 진입점 | Node.js |

---

## 📁 관련 파일

```
packages/vanilla/
├── server.js              ← Express 서버
├── src/
│   ├── main.js            ← 클라이언트 엔트리
│   ├── main-server.js     ← 🔥 서버 엔트리 (수정)
│   ├── router/
│   │   └── router.js      ← 라우터 로직
│   └── pages/
│       ├── HomePage.js
│       ├── ProductDetailPage.js
│       └── NotFoundPage.js
```

---

## 📝 구현 가이드

### 1️⃣ 서버용 라우터 매칭

```javascript
// src/main-server.js

// URL 경로에 따라 페이지 결정
function matchRoute(url) {
  // 홈페이지
  if (url === "/" || url === "") {
    return { page: "home", params: {} };
  }
  
  // 상품 상세 페이지
  const productMatch = url.match(/^\/products\/(\d+)/);
  if (productMatch) {
    return { page: "product", params: { id: productMatch[1] } };
  }
  
  // 404
  return { page: "notFound", params: {} };
}
```

### 2️⃣ 페이지 렌더링 함수

```javascript
// 페이지별 렌더링 로직
async function renderPage(route) {
  switch (route.page) {
    case "home":
      return renderHomePage();
    case "product":
      return renderProductDetailPage(route.params.id);
    default:
      return renderNotFoundPage();
  }
}
```

### 3️⃣ render 함수 export

```javascript
// 서버에서 호출할 메인 함수
export async function render(url) {
  const route = matchRoute(url);
  const appHtml = await renderPage(route);
  const appHead = generateHead(route);
  
  return { appHtml, appHead };
}
```

### 4️⃣ server.js에서 사용

```javascript
// server.js
import { render } from "./dist/vanilla-ssr/main-server.js";

app.get("*", async (req, res) => {
  const { appHtml, appHead } = await render(req.url);
  
  const html = template
    .replace("<!--app-html-->", appHtml)
    .replace("<!--app-head-->", appHead);
  
  res.status(200).set({ "Content-Type": "text/html" }).send(html);
});
```

---

## 🔍 서버 Router vs 클라이언트 Router

| 구분 | 서버 | 클라이언트 |
|-----|------|-----------|
| 라우팅 방식 | URL 문자열 파싱 | `history.pushState` |
| 이벤트 | 없음 | `popstate` |
| DOM 접근 | ❌ 불가 | ✅ 가능 |
| 렌더링 결과 | HTML 문자열 | DOM 업데이트 |

---

## ⚠️ 주의사항

### 서버에서 사용 불가한 API

```javascript
// ❌ 서버에서 에러 발생
window.location
document.getElementById
localStorage
sessionStorage

// ✅ 서버에서 사용 가능
URL 파싱 (문자열)
데이터 fetch
문자열 조작
```

### 동적 import 사용 시

```javascript
// 개발 환경에서는 Vite transform 필요
if (!isProduction) {
  const { render } = await vite.ssrLoadModule("/src/main-server.js");
}
```

---

## ✅ 완료 확인 방법

```bash
# 실행
pnpm run dev:ssr

# 테스트
# 1. http://localhost:5174/ → 홈페이지 렌더링
# 2. http://localhost:5174/products/1 → 상품 상세 렌더링
# 3. http://localhost:5174/invalid → 404 페이지 렌더링
```

**View Page Source**로 HTML에 내용이 있는지 확인!

---

## 🔗 다음 스텝

👉 [STEP 03: 클라이언트 Hydration](./03_client-hydration.md)

