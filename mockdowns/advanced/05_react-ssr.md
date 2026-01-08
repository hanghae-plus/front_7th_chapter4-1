# 🔵 STEP 05: React SSR

## 📌 이 스텝의 목표

> React 앱을 서버에서 `renderToString`으로 렌더링하기

---

## 🎯 완료 조건

- [ ] `renderToString` 서버 렌더링
- [ ] TypeScript SSR 모듈 빌드
- [ ] Universal React Router (서버/클라이언트 분기)
- [ ] React 상태관리 서버 초기화

---

## 🧠 핵심 개념

### renderToString이란?

```tsx
import { renderToString } from "react-dom/server";

// React 컴포넌트 → HTML 문자열
const html = renderToString(<App />);
// 결과: "<div><h1>Hello</h1></div>"
```

### 서버 vs 클라이언트 엔트리

| 파일 | 역할 | 사용 API |
|-----|------|---------|
| `main.tsx` | 클라이언트 | `hydrateRoot` |
| `main-server.tsx` | 서버 | `renderToString` |

---

## 📁 관련 파일

```
packages/react/
├── server.js              ← Express 서버
├── src/
│   ├── main.tsx           ← 클라이언트 엔트리
│   ├── main-server.tsx    ← 🔥 서버 엔트리
│   ├── App.tsx            ← 메인 앱 컴포넌트
│   └── router/
│       └── router.ts      ← Universal Router
```

---

## 📝 구현 가이드

### 1️⃣ main-server.tsx 기본 구조

```tsx
// src/main-server.tsx
import { renderToString } from "react-dom/server";
import App from "./App";

export async function render(url: string) {
  // React 앱을 문자열로 렌더링
  const appHtml = renderToString(<App url={url} />);
  
  return {
    appHtml,
    appHead: "",
    initialData: {},
  };
}
```

### 2️⃣ Universal Router 구현

```tsx
// 서버에서는 StaticRouter 사용
// 클라이언트에서는 BrowserRouter 사용

// App.tsx
interface AppProps {
  url?: string;  // 서버에서만 전달
}

function App({ url }: AppProps) {
  // 서버 환경 체크
  const isServer = typeof window === "undefined";
  
  if (isServer) {
    return (
      <StaticRouter location={url}>
        <Routes />
      </StaticRouter>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes />
    </BrowserRouter>
  );
}
```

### 3️⃣ 서버용 라우터 구현 (직접 구현 시)

```tsx
// router/router.ts
export function matchRoute(url: string) {
  const routes = [
    { path: "/", component: HomePage },
    { path: "/products/:id", component: ProductDetailPage },
  ];
  
  for (const route of routes) {
    const match = matchPath(url, route.path);
    if (match) {
      return { ...route, params: match.params };
    }
  }
  
  return { component: NotFoundPage, params: {} };
}
```

### 4️⃣ 데이터 프리페칭

```tsx
// src/main-server.tsx
export async function render(url: string) {
  // 1. 라우트 매칭
  const route = matchRoute(url);
  
  // 2. 데이터 프리페칭
  let initialData = {};
  
  if (route.path === "/") {
    const products = await fetchProducts();
    initialData = { products };
  } else if (route.path === "/products/:id") {
    const product = await fetchProduct(route.params.id);
    initialData = { product };
  }
  
  // 3. 상태 초기화 후 렌더링
  const appHtml = renderToString(
    <App url={url} initialData={initialData} />
  );
  
  return { appHtml, appHead: "", initialData };
}
```

### 5️⃣ TypeScript 빌드 설정

```json
// tsconfig.node.json (서버용)
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020",
    "jsx": "react-jsx"
  },
  "include": ["src/main-server.tsx"]
}
```

### 6️⃣ Vite SSR 빌드 설정

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    ssr: true,
    rollupOptions: {
      input: "src/main-server.tsx",
    },
  },
});
```

---

## 🔍 서버/클라이언트 분기 패턴

### 환경 체크

```tsx
// 서버 환경 체크
const isServer = typeof window === "undefined";

// 또는
const isClient = typeof document !== "undefined";
```

### 조건부 렌더링

```tsx
function MyComponent() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 클라이언트 전용 컴포넌트
  if (!mounted) {
    return <div>Loading...</div>;
  }
  
  return <ClientOnlyComponent />;
}
```

---

## ⚠️ 주의사항

### 서버에서 사용 불가한 Hook

```tsx
// ❌ 서버에서 에러
useEffect(() => {}, []);  // 실행은 되지만 동작 안함
useLayoutEffect(() => {}, []);  // 경고 발생

// ✅ 서버에서 안전
useState();
useContext();
useMemo();
```

### window/document 접근

```tsx
// ❌ 서버에서 에러
const width = window.innerWidth;

// ✅ 안전한 접근
const width = typeof window !== "undefined" ? window.innerWidth : 0;
```

---

## ✅ 완료 확인 방법

```bash
# 빌드
pnpm run build:server

# 실행
pnpm run dev:ssr

# 확인
# View Page Source → React 컴포넌트가 렌더링된 HTML
```

---

## 🔗 다음 스텝

👉 [STEP 06: React Hydration](./06_react-hydration.md)

