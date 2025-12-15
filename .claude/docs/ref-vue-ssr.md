# Vue SSR 제대로 적용하기

> 출처: https://zuminternet.github.io/vue-ssr/

## SSR(Server Side Rendering)의 개념

SSR은 "서버에서 HTML을 정제하여 출력해주는 기법"입니다. 전통적인 PHP, JSP, ASP와 같이 서버에서 완성된 HTML을 클라이언트에 전송하는 방식입니다.

## SSR이 필요한 이유

현대 프레임워크(React, Vue 등)는 CSR(Client Side Rendering) 방식을 사용하는데, 초기 HTML이 `<div id="app"></div>` 수준으로 비어있어 검색엔진이 페이지 내용을 파악하기 어렵습니다. SSR을 통해 "검색 엔진 최적화와 초기 로딩 속도를 개선"할 수 있습니다.

## SSR 적용 대상

모든 페이지에 필요한 것은 아닙니다. 콘텐츠 페이지(뉴스, 투자정보 등)처럼 색인이 중요한 경우에 선택적으로 적용합니다. 로그인 정보가 담긴 페이지는 보안 위험으로 CSR이 적합합니다.

## Vanilla JS로 구현하는 방식

1. **컴포넌트를 DOM 독립적으로 작성** - 브라우저와 Node.js 모두에서 실행 가능해야 함
2. **서버에서 HTML 문자열로 변환** - Express 등의 서버에서 컴포넌트를 실행하여 HTML 생성
3. **Hydration 적용** - SSR된 HTML 위에 클라이언트 스크립트를 로드하여 이벤트 등록

## Vue에서의 SSR 구현 과정

1. `vue-server-renderer` 패키지 설치
2. `main-ssr.js` 진입점 파일 작성 (서버용)
3. router와 store를 인스턴스 생성 함수로 수정
4. CSR과 SSR 별도 빌드 설정
5. 서버에서 번들 파일을 이용하여 HTML 생성

## 주의사항

- 브라우저(window, document) 전용 객체는 mounted 단계 이후에 접근
- 사용자마다 독립적인 store, router 인스턴스 필요
- SSR 오류 발생 시 CSR로 폴백 처리 권장
- 모든 페이지가 아닌 필요한 페이지만 선택적으로 적용
