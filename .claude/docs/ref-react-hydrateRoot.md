# hydrateRoot - React Hydration

> 출처: https://18.react.dev/reference/react-dom/client/hydrateRoot

## 개념

`hydrateRoot`는 서버에서 생성된 HTML을 클라이언트에서 React 컴포넌트로 "부착"하는 함수입니다.

**중요**: 서버 렌더링된 콘텐츠는 클라이언트 렌더링과 동일해야 합니다.

## 기본 사용법

```javascript
import { hydrateRoot } from 'react-dom/client';

const root = hydrateRoot(
  document.getElementById('root'),
  <App />
);
```

## 주요 파라미터

1. **domNode**: 서버에서 렌더링된 DOM 요소
2. **reactNode**: 렌더링할 React 컴포넌트 (일반적으로 JSX)
3. **options** (선택사항):
   - `onCaughtError`: 에러 바운더리가 잡은 오류 처리
   - `onUncaughtError`: 처리되지 않은 오류 처리
   - `identifierPrefix`: useId로 생성된 ID의 접두어

## Hydration이란?

서버의 정적 HTML을 클라이언트에서 동적 React 앱으로 변환하는 과정입니다. 사용자는 JavaScript 로드 전에 HTML을 보게 되므로, 서버와 클라이언트의 출력이 일치해야 합니다.

## 실전 예제

### 서버/클라이언트 다른 콘텐츠 처리

```javascript
function App() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <h1>{isClient ? 'Client' : 'Server'}</h1>;
}
```

### 전체 문서 hydrate

```javascript
hydrateRoot(document, <App />);
```

## 주의사항

- 서버와 클라이언트 렌더링 결과가 반드시 일치해야 함
- 개발 환경에서만 mismatch 경고가 표시됨
- `suppressHydrationWarning={true}`로 불가피한 차이 무시 가능

## Hydration 불일치 방지 팁

1. 서버와 클라이언트에서 동일한 데이터 사용
2. `Date.now()`, `Math.random()` 같은 비결정적 값 피하기
3. 브라우저 전용 API는 `useEffect` 내에서만 사용
4. 초기 데이터를 `window.__INITIAL_DATA__`로 전달
