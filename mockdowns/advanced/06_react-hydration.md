# 🔵 STEP 06: React Hydration

## 📌 이 스텝의 목표

> 서버 렌더링된 React 앱에 클라이언트 JavaScript 연결하기

---

## 🎯 완료 조건

- [ ] `hydrateRoot` 사용
- [ ] Hydration 불일치 방지
- [ ] 클라이언트 상태 복원
- [ ] 이벤트 핸들러 정상 동작

---

## 🧠 핵심 개념

### createRoot vs hydrateRoot

| API | 용도 | 동작 |
|-----|------|------|
| `createRoot` | CSR | 빈 DOM에 새로 렌더링 |
| `hydrateRoot` | SSR | 기존 HTML에 이벤트 연결 |

### Hydration 과정

```
서버 HTML (정적)
     ↓
hydrateRoot() 호출
     ↓
React가 DOM과 비교
     ↓
일치하면 이벤트만 연결
     ↓
인터랙티브한 앱
```

---

## 📁 관련 파일

```
packages/react/
├── src/
│   ├── main.tsx           ← 🔥 Hydration 로직
│   ├── main-server.tsx    ← 초기 데이터 생성
│   └── App.tsx            ← 메인 컴포넌트
```

---

## 📝 구현 가이드

### 1️⃣ 기본 Hydration

```tsx
// src/main.tsx
import { hydrateRoot } from "react-dom/client";
import App from "./App";

// SSR된 HTML이 있으면 hydrate
hydrateRoot(document.getElementById("root")!, <App />);
```

### 2️⃣ 초기 데이터 복원

```tsx
// src/main.tsx
import { hydrateRoot } from "react-dom/client";
import App from "./App";

// 서버에서 주입한 초기 데이터
const initialData = window.__INITIAL_DATA__;

// 초기 데이터와 함께 hydrate
hydrateRoot(
  document.getElementById("root")!,
  <App initialData={initialData} />
);
```

### 3️⃣ 타입 정의

```tsx
// src/types.ts
declare global {
  interface Window {
    __INITIAL_DATA__?: {
      products?: Product[];
      product?: Product;
    };
  }
}

export interface InitialData {
  products?: Product[];
  product?: Product;
}
```

### 4️⃣ App에서 초기 데이터 사용

```tsx
// src/App.tsx
interface AppProps {
  url?: string;
  initialData?: InitialData;
}

function App({ url, initialData }: AppProps) {
  // Context나 Store에 초기 데이터 주입
  return (
    <DataProvider initialData={initialData}>
      <Router url={url}>
        <Routes />
      </Router>
    </DataProvider>
  );
}
```

### 5️⃣ 상태 관리 초기화

```tsx
// Zustand 예시
const useProductStore = create((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
}));

// 초기화 함수
export function initializeStore(data: InitialData) {
  if (data?.products) {
    useProductStore.setState({ products: data.products });
  }
}

// main.tsx에서 호출
const initialData = window.__INITIAL_DATA__;
if (initialData) {
  initializeStore(initialData);
}
```

---

## 🔍 Hydration 불일치 문제

### 원인

서버 렌더링 HTML ≠ 클라이언트 초기 렌더링

### 콘솔 에러 예시

```
Warning: Text content did not match. 
Server: "2024-01-15" Client: "2024-01-16"
```

### 흔한 원인과 해결책

#### 1. 시간/날짜

```tsx
// ❌ 불일치 발생
function Time() {
  return <span>{new Date().toLocaleString()}</span>;
}

// ✅ suppressHydrationWarning 사용
function Time() {
  return (
    <span suppressHydrationWarning>
      {new Date().toLocaleString()}
    </span>
  );
}

// ✅ 또는 클라이언트에서만 렌더링
function Time() {
  const [time, setTime] = useState<string | null>(null);
  
  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);
  
  return <span>{time ?? "Loading..."}</span>;
}
```

#### 2. 랜덤 값

```tsx
// ❌ 불일치 발생
const id = Math.random().toString();

// ✅ 서버에서 생성한 값 사용
const id = initialData.generatedId;
```

#### 3. 브라우저 전용 API

```tsx
// ❌ 서버에서 undefined
const width = window.innerWidth;

// ✅ 조건부 접근
const [width, setWidth] = useState(0);
useEffect(() => {
  setWidth(window.innerWidth);
}, []);
```

---

## ⚠️ 주의사항

### Strict Mode와 Hydration

```tsx
// 개발 모드에서 2번 렌더링되어 혼란스러울 수 있음
<StrictMode>
  <App />
</StrictMode>
```

### useEffect 타이밍

```tsx
// useEffect는 hydration 완료 후 실행
useEffect(() => {
  console.log("Hydration 완료!");
}, []);
```

### 서버/클라이언트 코드 분리

```tsx
// 클라이언트 전용 import (dynamic import)
const ClientOnlyComponent = lazy(() => import("./ClientOnly"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientOnlyComponent />
    </Suspense>
  );
}
```

---

## ✅ 완료 확인 방법

```bash
# 실행
pnpm run dev:ssr

# 확인 사항
# 1. 콘솔에 Hydration 경고 없음
# 2. 버튼 클릭 등 이벤트 정상 동작
# 3. 페이지 새로고침 시 깜빡임 없음
```

### 디버깅 팁

```tsx
// Hydration 전후 확인
useEffect(() => {
  console.log("Hydration 완료");
  console.log("초기 데이터:", window.__INITIAL_DATA__);
}, []);
```

---

## 🔗 다음 스텝

👉 [STEP 07: React SSG](./07_react-ssg.md)

