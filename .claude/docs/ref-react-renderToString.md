# renderToString - React 서버 렌더링

> 출처: https://18.react.dev/reference/react-dom/server/renderToString

## 개요

`renderToString`은 React 트리를 HTML 문자열로 렌더링하는 서버 측 함수입니다.

**주의**: 스트리밍이나 데이터 대기를 지원하지 않습니다.

## 사용법

```javascript
import { renderToString } from 'react-dom/server';

const html = renderToString(<App />);
```

서버에서 앱을 HTML 문자열로 변환한 후, 클라이언트에서 `hydrateRoot`로 상호작용 가능하게 만듭니다.

## 파라미터

- **reactNode**: 렌더링할 React 노드 (예: `<App />`)
- **options** (선택사항):
  - `identifierPrefix`: `useId`로 생성된 ID의 접두사. 같은 페이지에서 여러 루트 사용 시 충돌 방지

## 반환값

HTML 문자열을 반환합니다.

## 주요 제한사항

1. **Suspense 지원 제한** - 컴포넌트가 일시중단되면 폴백을 즉시 HTML로 전송
2. **스트리밍 미지원** - 데이터 로딩 대기 불가능

## 권장 대안

- Node.js: `renderToPipeableStream`
- Deno/Edge 런타임: `renderToReadableStream`

## 예제: Express 서버에서 사용

```javascript
import express from 'express';
import { renderToString } from 'react-dom/server';
import App from './App';

const app = express();

app.get('/', (req, res) => {
  const html = renderToString(<App />);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>My App</title></head>
      <body>
        <div id="root">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});
```
