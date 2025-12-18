# Vite SSR 템플릿 구조

> 출처:
> - https://github.com/bluwy/create-vite-extra/tree/master/template-ssr-vanilla
> - https://github.com/bluwy/create-vite-extra/tree/master/template-ssr-react

## Vanilla SSR 템플릿 구조

```
template-ssr-vanilla/
├── public/          # 정적 자산 저장소
├── src/             # 소스 코드 디렉토리
├── index.html       # HTML 진입점
├── server.js        # SSR 서버 구현
├── package.json     # 프로젝트 의존성
└── _gitignore       # Git 무시 규칙
```

### 핵심 파일 역할

| 파일 | 역할 |
|------|------|
| `server.js` | 서버 렌더링 로직 구현의 중심. Node.js 기반 SSR 서버 실행 |
| `package.json` | SSR에 필요한 의존성 패키지 정의 |
| `index.html` | 서버에서 렌더링될 초기 마크업 템플릿 |
| `src/` | 클라이언트와 서버 양쪽에서 실행 가능한 공유 코드 |

## React SSR 템플릿 구조

```
template-ssr-react/
├── public/          # 정적 자산 저장소
├── src/             # React 소스 코드
├── index.html       # HTML 진입점
├── server.js        # SSR 서버 구현
├── vite.config.js   # Vite 번들러 설정
├── package.json     # 프로젝트 의존성
└── _gitignore       # Git 무시 규칙
```

### 핵심 파일 역할

| 파일 | 역할 |
|------|------|
| `server.js` | 서버 측 렌더링 로직 담당 |
| `vite.config.js` | 빌드 최적화 관리 |
| `src/` | React 컴포넌트 소스 |
| `package.json` | 필요한 라이브러리 의존성 정의 |

## 공통 패턴

1. **server.js**: 개발/프로덕션 환경 분기 처리
2. **src/**: 클라이언트와 서버 공유 코드
3. **index.html**: `<!--ssr-outlet-->` 또는 `<!--app-html-->` 플레이스홀더 포함
4. **빌드 분리**: 클라이언트 빌드와 서버 빌드 별도 수행
