# 🟢 STEP 03: 클라이언트 Hydration

## 📌 이 스텝의 목표

> 서버에서 렌더링한 HTML에 클라이언트 JavaScript를 연결하기

---

## 🎯 완료 조건

- [ ] `window.__INITIAL_DATA__` 스크립트 주입
- [ ] 클라이언트에서 초기 데이터 복원
- [ ] 서버-클라이언트 데이터 일치
- [ ] 이벤트 핸들러 정상 동작

---

## 🧠 핵심 개념

### Hydration이란?

```
서버 렌더링된 HTML (정적)
        ↓
   + JavaScript
        ↓
인터랙티브한 앱 (동적)
```

> 💧 "물을 주다" = 정적인 HTML에 생명(JS)을 불어넣는 과정

### 왜 필요한가?

| 단계 | 상태 | 사용자 경험 |
|-----|------|------------|
| 서버 HTML 도착 | 정적 | 화면은 보이지만 클릭 안됨 |
| JS 로드 완료 | 동적 | 모든 기능 동작 |

---

## 📁 관련 파일

```
packages/vanilla/
├── server.js              ← 초기 데이터 주입
├── src/
│   ├── main.js            ← 🔥 Hydration 로직
│   ├── main-server.js     ← 초기 데이터 생성
│   └── stores/
│       ├── productStore.js
│       └── cartStore.js
```

---

## 📝 구현 가이드

### 1️⃣ 서버에서 초기 데이터 주입

```javascript
// server.js
const { appHtml, appHead, initialData } = await render(req.url);

// 초기 데이터를 스크립트로 주입
const dataScript = `
  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
  </script>
`;

const html = template
  .replace("<!--app-html-->", appHtml)
  .replace("<!--app-head-->", appHead + dataScript);
```

### 2️⃣ main-server.js에서 데이터 반환

```javascript
// src/main-server.js
export async function render(url) {
  // 데이터 프리페칭
  const products = await fetchProducts();
  
  // 스토어 초기화
  initializeStore({ products });
  
  // HTML 렌더링
  const appHtml = renderPage(url);
  
  return {
    appHtml,
    appHead: generateHead(),
    initialData: {
      products,
      // 기타 필요한 상태
    }
  };
}
```

### 3️⃣ 클라이언트에서 데이터 복원

```javascript
// src/main.js

// 서버에서 주입한 초기 데이터 확인
const initialData = window.__INITIAL_DATA__;

if (initialData) {
  // 서버 데이터로 스토어 초기화
  initializeStore(initialData);
} else {
  // CSR 모드: 클라이언트에서 데이터 fetch
  await fetchAndInitialize();
}

// Hydration 또는 일반 렌더링
renderApp();
```

### 4️⃣ 스토어 초기화 함수

```javascript
// src/stores/productStore.js
export function initializeStore(data) {
  if (data?.products) {
    productStore.setState({ products: data.products });
  }
}
```

---

## 🔍 Hydration 불일치 문제

### 원인

서버 HTML ≠ 클라이언트 렌더링 결과

### 흔한 실수

```javascript
// ❌ 시간 기반 값 (서버/클라이언트 다름)
const time = new Date().toLocaleString();

// ❌ 랜덤 값
const id = Math.random();

// ❌ 브라우저 전용 API
const width = window.innerWidth;
```

### 해결책

```javascript
// ✅ 서버에서 생성한 값을 클라이언트로 전달
const initialData = window.__INITIAL_DATA__;
const time = initialData?.serverTime || new Date().toLocaleString();
```

---

## ⚠️ 주의사항

### JSON 직렬화 주의

```javascript
// ❌ XSS 취약점
window.__INITIAL_DATA__ = ${JSON.stringify(data)};

// ✅ 안전한 방법 (</script> 이스케이프)
window.__INITIAL_DATA__ = ${JSON.stringify(data).replace(/</g, '\\u003c')};
```

### 초기 데이터 크기

- 너무 크면 HTML 크기 증가 → 초기 로딩 느려짐
- 필요한 데이터만 전달

---

## ✅ 완료 확인 방법

```bash
# 실행
pnpm run dev:ssr

# 확인 사항
# 1. View Page Source → __INITIAL_DATA__ 스크립트 존재
# 2. 페이지 로드 후 버튼 클릭 동작
# 3. 콘솔에 Hydration 에러 없음
```

### 디버깅 팁

```javascript
// 브라우저 콘솔에서 확인
console.log(window.__INITIAL_DATA__);
```

---

## 🔗 다음 스텝

👉 [STEP 04: Static Site Generation](./04_static-site-generation.md)

