# Vite SSR (Server-Side Rendering)

> 출처: https://vite.dev/guide/ssr

## 개요

Vite SSR은 React, Vue, Svelte 등의 프런트엔드 프레임워크가 Node.js에서 실행되어 HTML로 미리 렌더링된 후 클라이언트에서 수화(hydration)되는 방식을 지원합니다.

## 프로젝트 구조

```
- index.html
- server.js (메인 서버)
- src/
  - main.js (범용 앱 코드)
  - entry-client.js (클라이언트 마운팅)
  - entry-server.js (서버 렌더링)
```

## 개발 모드 설정

**핵심 개념**: Vite를 미들웨어 모드로 실행하여 Express 등과 통합합니다.

```javascript
// server.js - Express와의 통합
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom'
})
app.use(vite.middlewares)

// 요청 처리
app.use('*all', async (req, res) => {
  let template = fs.readFileSync('index.html', 'utf-8')
  template = await vite.transformIndexHtml(url, template)
  const { render } = await vite.ssrLoadModule('/src/entry-server.js')
  const appHtml = await render(url)
  const html = template.replace(`<!--ssr-outlet-->`, appHtml)
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
})
```

## 프로덕션 빌드

**빌드 스크립트**:

```json
{
  "scripts": {
    "build:client": "vite build --outDir dist/client --ssrManifest",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.js"
  }
}
```

**주요 차이점**:

- 클라이언트 빌드와 서버 빌드 분리
- `--ssr` 플래그로 서버 번들 생성
- `vite.ssrLoadModule()` 대신 `import()`로 직접 로드
- 정적 파일 제공 미들웨어 추가

## 조건부 로직

```javascript
if (import.meta.env.SSR) {
  // 서버 전용 로직
}
```

## 주요 특징

- **SSR 외부화**: 의존성이 기본적으로 외부화되어 성능 향상
- **매니페스트 생성**: 프리로드 지시자 생성을 위한 `.vite/ssr-manifest.json`
- **사전 렌더링 지원**: 정적 사이트 생성(SSG) 가능
