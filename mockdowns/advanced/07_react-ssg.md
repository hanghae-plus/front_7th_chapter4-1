# 🔵 STEP 07: React SSG

## 📌 이 스텝의 목표

> React 앱의 모든 페이지를 빌드 시점에 정적 HTML로 생성하기

---

## 🎯 완료 조건

- [ ] 동적 라우트 SSG (상품 상세 페이지들)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포
- [ ] GitHub Pages 배포 가능

---

## 🧠 핵심 개념

### React SSG 흐름

```
빌드 시점
    ↓
모든 라우트 수집
    ↓
각 라우트마다 renderToString()
    ↓
HTML 파일 저장
    ↓
CDN/GitHub Pages 배포
```

### SSR과의 차이점

| 구분 | SSR | SSG |
|-----|-----|-----|
| 렌더링 시점 | 요청마다 | 빌드 시 1번 |
| 데이터 | 실시간 | 빌드 시점 스냅샷 |
| 서버 | Node.js 필요 | 정적 호스팅 가능 |

---

## 📁 관련 파일

```
packages/react/
├── static-site-generate.js  ← 🔥 SSG 스크립트
├── dist/
│   └── react/
│       ├── index.html
│       └── products/
│           ├── 1.html
│           └── ...
```

---

## 📝 구현 가이드

### 1️⃣ SSG 스크립트 기본 구조

```javascript
// static-site-generate.js
import fs from "fs";
import path from "path";

async function generateStaticSite() {
  // 1. 빌드된 서버 모듈 import
  const { render } = await import("./dist/react-ssr/main-server.js");
  
  // 2. 템플릿 읽기
  const template = fs.readFileSync("dist/react/index.html", "utf-8");
  
  // 3. 라우트 수집
  const routes = await getRoutes();
  
  // 4. 각 라우트 생성
  for (const route of routes) {
    await generatePage(route, template, render);
  }
  
  console.log("✅ React SSG 완료!");
}

generateStaticSite();
```

### 2️⃣ 라우트 수집

```javascript
async function getRoutes() {
  // 정적 라우트
  const staticRoutes = ["/"];
  
  // 동적 라우트 - 상품 목록에서 생성
  const response = await fetch("http://localhost:3000/api/products");
  const products = await response.json();
  
  const productRoutes = products.map(p => `/products/${p.id}`);
  
  // 404 페이지
  const errorRoutes = ["/404"];
  
  return [...staticRoutes, ...productRoutes, ...errorRoutes];
}
```

### 3️⃣ 페이지 생성

```javascript
async function generatePage(route, template, render) {
  try {
    // renderToString 실행
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
    
    // 저장
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
    
    console.log(`✅ 생성: ${filePath}`);
  } catch (error) {
    console.error(`❌ 실패: ${route}`, error);
  }
}
```

### 4️⃣ 파일 경로 결정

```javascript
function getFilePath(route) {
  const basePath = "../../dist/react";
  
  if (route === "/") {
    return path.join(basePath, "index.html");
  }
  
  if (route === "/404") {
    return path.join(basePath, "404.html");
  }
  
  // /products/1 → dist/react/products/1.html
  return path.join(basePath, `${route}.html`);
}
```

### 5️⃣ package.json 스크립트

```json
{
  "scripts": {
    "build:client": "vite build --outDir ./dist/react",
    "build:server": "vite build --outDir ./dist/react-ssr --ssr src/main-server.tsx",
    "build:ssg": "pnpm run build:client && pnpm run build:server && node static-site-generate.js",
    "preview:ssg": "vite preview --outDir ./dist/react"
  }
}
```

---

## 🔍 GitHub Pages 배포

### 1. 404.html 처리

```javascript
// GitHub Pages는 404.html을 자동으로 사용
// SPA fallback을 위해 404.html도 생성

async function generatePage(route, template, render) {
  // ...
  
  // 404 페이지 특별 처리
  if (route === "/404") {
    fs.writeFileSync(path.join(basePath, "404.html"), html);
  }
}
```

### 2. base path 설정

```typescript
// vite.config.ts
export default defineConfig({
  base: "/front-7th-chapter4-1/",  // 레포지토리 이름
});
```

### 3. 배포 명령어

```bash
# 빌드 및 배포
pnpm run build:ssg
pnpm run gh-pages
```

---

## ⚠️ 주의사항

### 빌드 순서

```bash
# 반드시 이 순서로!
1. build:client  # 클라이언트 번들 생성
2. build:server  # SSR 모듈 생성  
3. SSG 스크립트  # HTML 파일 생성
```

### 데이터 API 필요

```javascript
// SSG 시점에 데이터 API가 실행 중이어야 함
// 또는 정적 JSON 파일 사용

// 방법 1: Mock 서버 실행
// 방법 2: 정적 JSON import
import products from "./mocks/items.json";
```

### 대용량 페이지

```javascript
// 상품이 많을 때 병렬 처리
const BATCH_SIZE = 10;

for (let i = 0; i < routes.length; i += BATCH_SIZE) {
  const batch = routes.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(route => generatePage(route, template, render)));
}
```

---

## ✅ 완료 확인 방법

```bash
# 빌드 실행
pnpm run build:ssg

# 생성된 파일 확인
ls dist/react/products/

# 로컬 프리뷰
pnpm run preview:ssg

# GitHub Pages 배포
pnpm run gh-pages
```

### 확인 사항

- [ ] `dist/react/products/*.html` 파일들 존재
- [ ] 각 HTML에 `__INITIAL_DATA__` 포함
- [ ] GitHub Pages에서 정상 동작
- [ ] 새로고침해도 페이지 유지

---

## 🎉 심화과제 완료!

축하합니다! 🎊  
SSR과 SSG의 전체 흐름을 이해하고 구현했습니다.

---

## 📚 추가 학습

- ISR (Incremental Static Regeneration)
- Streaming SSR
- React Server Components
- Next.js / Remix 프레임워크

