# 🟢 STEP 01: Express SSR 서버 뼈대

## 📌 이 스텝의 목표

> Express 서버에서 HTML 템플릿을 읽고, 문자열 치환으로 응답하기

아직 **React도, 데이터도 신경 쓰지 마!**  
이게 되면 **SSR 50% 성공**이야.

---

## 🎯 완료 조건

- [ ] Express 서버 생성
- [ ] `index.html` 템플릿 읽기
- [ ] `<!--app-html-->` 치환
- [ ] `<!--app-head-->` 치환
- [ ] 개발/프로덕션 환경 분기

---

## 🧠 핵심 개념

### HTML 템플릿 구조

```html
<!DOCTYPE html>
<html>
  <head>
    <!--app-head-->
  </head>
  <body>
    <div id="root"><!--app-html--></div>
  </body>
</html>
```

### 치환이 필요한 이유

| 플레이스홀더 | 역할 |
|-------------|------|
| `<!--app-html-->` | 서버에서 렌더링한 HTML이 들어갈 자리 |
| `<!--app-head-->` | SEO 메타태그, 초기 데이터 스크립트 등 |

---

## 📁 관련 파일

```
packages/vanilla/
├── server.js          ← 🔥 이 파일을 수정
├── index.html         ← 템플릿 파일
└── src/
    └── main-server.js ← 서버 렌더링 로직 (나중에)
```

---

## 📝 구현 가이드

### 1️⃣ Express 서버 기본 구조

```javascript
import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5174;

// 프로덕션 여부 확인
const isProduction = process.env.NODE_ENV === "production";
```

### 2️⃣ HTML 템플릿 읽기

```javascript
// 템플릿 경로 (개발/프로덕션에 따라 다름)
const templatePath = isProduction
  ? path.resolve("dist/vanilla/index.html")
  : path.resolve("index.html");

// 템플릿 읽기
const template = fs.readFileSync(templatePath, "utf-8");
```

### 3️⃣ 문자열 치환

```javascript
// HTML 문자열 치환
const html = template
  .replace("<!--app-html-->", "<h1>Hello SSR!</h1>")
  .replace("<!--app-head-->", "<title>SSR Test</title>");
```

### 4️⃣ 응답 보내기

```javascript
app.get("*", (req, res) => {
  // ... 치환 로직
  res.status(200).set({ "Content-Type": "text/html" }).send(html);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

---

## 🔍 개발/프로덕션 환경 분기

| 환경 | 특징 | 템플릿 위치 |
|-----|------|------------|
| 개발 | Vite 미들웨어 사용 | `./index.html` |
| 프로덕션 | 빌드된 파일 서빙 | `./dist/vanilla/index.html` |

### 개발 환경 설정 (Vite 미들웨어)

```javascript
if (!isProduction) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
}
```

### 프로덕션 환경 설정 (정적 파일 서빙)

```javascript
if (isProduction) {
  app.use(express.static("dist/vanilla"));
}
```

---

## ⚠️ 주의사항

1. **Windows 환경**: `cross-env` 사용 필수
2. **템플릿 경로**: 개발/프로덕션 경로 다름
3. **미들웨어 순서**: 정적 파일 서빙 → SSR 라우트

---

## ✅ 완료 확인 방법

```bash
# 개발 모드 실행
pnpm run dev:ssr

# 브라우저에서 확인
# http://localhost:5174
# → "Hello SSR!" 텍스트가 보이면 성공!
```

---

## 🔗 다음 스텝

👉 [STEP 02: 서버 사이드 렌더링](./02_server-side-rendering.md)

