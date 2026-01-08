# 🟢 STEP 04: Static Site Generation

## 📌 이 스텝의 목표

> 빌드 시점에 모든 페이지의 HTML 파일을 미리 생성하기

---

## 🎯 완료 조건

- [ ] 모든 라우트 목록 정의
- [ ] 동적 라우트 생성 (상품 상세 페이지들)
- [ ] 각 라우트별 HTML 파일 생성
- [ ] 파일 시스템에 저장

---

## 🧠 핵심 개념

### SSG 흐름

```
빌드 시점 (Node 스크립트)
        ↓
모든 페이지 URL 수집
        ↓
각 URL마다 render() 실행
        ↓
HTML 파일로 저장
        ↓
/dist/products/1.html
/dist/products/2.html
...
```

### SSR vs SSG 타이밍

| 방식 | HTML 생성 시점 | 서버 필요 |
|-----|---------------|----------|
| SSR | 매 요청마다 | ✅ 필요 |
| SSG | 빌드 시 1번 | ❌ 불필요 |

---

## 📁 관련 파일

```
packages/vanilla/
├── static-site-generate.js  ← 🔥 SSG 스크립트
├── dist/
│   └── vanilla/
│       ├── index.html
│       └── products/
│           ├── 1.html
│           ├── 2.html
│           └── ...
```

---

## 📝 구현 가이드

### 1️⃣ SSG 스크립트 기본 구조

```javascript
// static-site-generate.js
import fs from "fs";
import path from "path";
import { render } from "./dist/vanilla-ssr/main-server.js";

async function generateStaticSite() {
  // 1. 템플릿 읽기
  const template = fs.readFileSync("dist/vanilla/index.html", "utf-8");
  
  // 2. 모든 라우트 수집
  const routes = await getRoutes();
  
  // 3. 각 라우트별 HTML 생성
  for (const route of routes) {
    await generatePage(route, template);
  }
  
  console.log("✅ SSG 완료!");
}

generateStaticSite();
```

### 2️⃣ 라우트 수집

```javascript
async function getRoutes() {
  // 정적 라우트
  const staticRoutes = ["/"];
  
  // 동적 라우트 (상품 목록에서 생성)
  const products = await fetchAllProducts();
  const productRoutes = products.map(p => `/products/${p.id}`);
  
  return [...staticRoutes, ...productRoutes];
}
```

### 3️⃣ 페이지 생성 함수

```javascript
async function generatePage(route, template) {
  // 렌더링
  const { appHtml, appHead, initialData } = await render(route);
  
  // 초기 데이터 스크립트
  const dataScript = `
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, '\\u003c')};
    </script>
  `;
  
  // HTML 조립
  const html = template
    .replace("<!--app-html-->", appHtml)
    .replace("<!--app-head-->", appHead + dataScript);
  
  // 파일 경로 결정
  const filePath = getFilePath(route);
  
  // 디렉토리 생성 & 파일 저장
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
  
  console.log(`생성: ${filePath}`);
}
```

### 4️⃣ 파일 경로 결정

```javascript
function getFilePath(route) {
  const basePath = "dist/vanilla";
  
  if (route === "/") {
    return path.join(basePath, "index.html");
  }
  
  // /products/1 → dist/vanilla/products/1.html
  return path.join(basePath, `${route}.html`);
}
```

---

## 🔍 디렉토리 구조

### 생성 전
```
dist/vanilla/
├── index.html
└── assets/
```

### 생성 후
```
dist/vanilla/
├── index.html
├── products/
│   ├── 1.html
│   ├── 2.html
│   ├── 3.html
│   └── ...
└── assets/
```

---

## ⚠️ 주의사항

### 404 페이지 처리

```javascript
// GitHub Pages용 404.html 생성
const { appHtml, appHead } = await render("/404");
fs.writeFileSync("dist/vanilla/404.html", html);
```

### 빌드 순서

```bash
# 1. 클라이언트 빌드
pnpm run build:client

# 2. 서버 빌드
pnpm run build:server

# 3. SSG 실행
node static-site-generate.js
```

### package.json 스크립트

```json
{
  "scripts": {
    "build:ssg": "pnpm run build:client && pnpm run build:server && node static-site-generate.js"
  }
}
```

---

## ✅ 완료 확인 방법

```bash
# 빌드 실행
pnpm run build:ssg

# 생성된 파일 확인
ls dist/vanilla/products/

# 로컬 서버로 확인
pnpm run preview:ssg
```

### 확인 사항

- [ ] `dist/vanilla/products/1.html` 파일 존재
- [ ] 각 HTML 파일에 `__INITIAL_DATA__` 포함
- [ ] 페이지 소스에 상품 정보 렌더링됨

---

## 🎉 기본과제 완료!

여기까지 완료했다면 기본과제 체크리스트를 모두 달성한 것입니다!

---

## 🔗 다음 스텝 (심화과제)

👉 [STEP 05: React SSR](../advanced/05_react-ssr.md)

