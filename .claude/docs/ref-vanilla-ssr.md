# 프레임워크 없이 만드는 SSR

> 출처: https://junilhwang.github.io/TIL/Javascript/Design/Vanilla-JS-Server-Side-Rendering/

## SSR의 개념

**SSR(Server Side Rendering)**은 "서버에서 HTML을 문자열로 만들어주는 것"입니다. 과거 PHP 시대에는 자연스러웠던 방식으로, 서버가 동적으로 완성된 HTML을 클라이언트에 전달합니다.

**CSR(Client Side Rendering)**은 스마트폰과 모바일 앱 등장 이후 발전했습니다. 브라우저에서 JavaScript로 UI를 그리는 현대적 방식입니다.

## SSR이 필요한 이유

- **빠른 초기 렌더링**: JavaScript 파싱 전에 완성된 HTML 표시
- **SEO 최적화**: 검색 엔진이 페이지 내용을 색인 가능
- **사용성 확보**: 사용자가 즉시 의미 있는 콘텐츠 확인

## 핵심 아키텍처: 관심사 분리

```
런타임 독립 코드 (Server/Client 공유)
├── Model: 데이터 & 비즈니스 로직
└── Component: HTML 문자열 생성

런타임 종속 코드
├── Server: HTML 문자열 응답
└── Client: DOM 조작 & 이벤트 바인딩
```

## 구현 핵심 단계

### 1단계: 컴포넌트 작성 (공유 코드)

```javascript
const TodoItem = item => `<li>${item}</li>`;
const TodoList = items => `<ul>${items.map(TodoItem).join('')}</ul>`;
```

### 2단계: SSR - HTML 생성

서버에서 "컴포넌트를 문자열로 조합해 클라이언트에 전송"

### 3단계: Hydration - CSR 적용

브라우저에서 "동일한 컴포넌트로 DOM 재생성 후 이벤트 바인딩"

### 4단계: 데이터 동기화

- Server → Client: `window.__INITIAL_MODEL__` 사용
- Client → Server: API 호출로 업데이트
- Client에서 렌더링 시 새로고침 없이 UI 갱신

## 주요 패턴

MVVM 패턴으로 "Model(데이터) → ViewModel(구조) → View(표현)"을 분리하면, 동일 코드로 문자열(SSR)과 DOM(CSR) 양쪽 생성 가능합니다.

이 접근법으로 테스트 가능성도 높아집니다.
