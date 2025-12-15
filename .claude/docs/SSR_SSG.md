# SSR과 SSG

> SSR(Server Side Rendering)과 SSG(Static Site Generation)은 웹 애플리케이션에서 초기 페이지 로딩 속도, 검색 엔진 최적화(SEO) 및 사용자 경험을 좌우하기 때문에 중요합니다. SSR은 서버가 사용자 요청 시 HTML을 즉시 생성해 전달하기 때문에 사용자 맞춤형 콘텐츠나 자주 바뀌는 데이터에 유리합니다. 반면 SSG는 빌드 시점에 HTML을 만들어 CDN에 배포하므로, 자주 변하지 않는 페이지를 매우 빠르고 저렴하게 제공할 수 있습니다. 따라서 서비스 성격에 따라 어떤 페이지는 SSR, 어떤 페이지는 SSG로 처리하는 하이브리드 구성이 대부분의 실제 서비스에서 가장 효율적입니다.
>
> 이러한 전략을 잘 쓰기 위해서는 **어떤 콘텐츠가 정적이고 어떤 콘텐츠가 동적인지 분류**하는 것이 중요합니다. 또한 단순히 SSR/SSG만 고려할 것이 아니라 캐싱 전략(CDN, Edge Caching), 데이터 패칭 방식(Incremental Static Regeneration, Streaming), 그리고 클라이언트 사이드 렌더링(CSR)과의 조합까지 이해해야 합니다. 더 나아가 글로벌 서비스를 한다면 네트워크 지연(latency), 브라우저 렌더링 최적화, 보안(인증·권한 처리)까지도 함께 고려해야 최적의 사용자 경험을 보장할 수 있습니다.

## SSR과 SSG를 이해하기 위해 필요한 지식

1. CDN (Content Delivery Network)
   - SSR/SSG 성능을 결정하는 핵심은 얼마나 빠르게 콘텐츠를 사용자에게 전달하느냐입니다.
   - 정적으로 생성된 페이지(SSG)는 CDN과 궁합이 특히 좋으며, SSR도 **Edge 서버**와 결합하면 지연 시간을 크게 줄일 수 있습니다.
2. ISR (Incremental Static Regeneration)
   - Next.js 등 최신 프레임워크에서 제공하는 기능으로, 정적 페이지를 필요할 때만 갱신합니다.
   - 전체 사이트를 다시 빌드하지 않고 특정 페이지만 업데이트할 수 있어, **SSG의 단점(정적이라 업데이트 어려움)을 보완**합니다.
3. CSR (Client Side Rendering)
   - SSR/SSG만으로 모든 문제를 해결할 수 없기 때문에 CSR도 반드시 이해해야 합니다.
   - 초기 페이지는 SSR/SSG로 빠르게 보여주고, 이후 인터랙션은 CSR로 처리하는 **Hydration 패턴**이 일반적입니다.
4. Edge Computing / Serverless
   - SSR을 글로벌 규모로 빠르게 제공하려면 서버를 중앙에 두기보다는 **사용자 가까운 엣지 위치에서 렌더링**하는 것이 중요합니다.
   - AWS Lambda\@Edge, Vercel Edge Functions, Cloudflare Workers 등이 대표적입니다.
5. Caching 전략 (HTTP Caching, Revalidation, Stale-While-Revalidate)
   - SSR/SSG가 아무리 빨라도, 캐싱이 제대로 안 되면 성능을 유지할 수 없습니다.
   - `Cache-Control`, `ETag`, `stale-while-revalidate` 같은 정책을 이해하면 **SSR/SSG + CDN + CSR** 조합에서 최적 성능을 낼 수 있습니다.
6. Hydration & Partial Hydration
   - SSR/SSG로 만들어진 정적 HTML을 브라우저에서 **JS로 인터랙션 가능한 앱으로 변환**하는 과정.
   - 최근에는 **Partial Hydration, Islands Architecture, React Server Components** 같은 기법이 등장해 **불필요한 JS 로딩 최소화**에 집중하고 있음.
7. Streaming SSR
   - 서버가 HTML을 한 번에 다 그려서 보내는 대신, **조각 단위로 스트리밍**해 사용자에게 더 빠르게 첫 화면을 보여주는 기법.
   - React 18, Next.js, Remix 등이 지원. 특히 데이터가 무겁거나 비동기 호출이 많은 경우 유리.
8. SEO & 메타데이터 관리
   - SSR/SSG는 SEO에 강점이 있지만, **Open Graph, Structured Data, Canonical URL** 같은 세부 설정이 제대로 되어야 효과적임.
   - 검색 유입이 중요한 서비스라면 필수 고려 요소.
9. 빌드 최적화 & 배포 파이프라인
   - SSG는 페이지 수가 많을수록 빌드 시간이 기하급수적으로 늘어날 수 있음.
   - 따라서 **Incremental Build, On-demand Revalidation, CI/CD 파이프라인 최적화**를 이해해야 함.
10. 보안과 인증 처리
    - SSR은 서버 요청 시 인증 정보를 처리하기 쉽지만, SSG에서는 보안 민감한 페이지를 다루기 까다로움.
    - JWT, OAuth, Edge Middleware 같은 인증 전략과 결합이 필요.
11. 데이터 패칭 전략
    - SSR/SSG/CSR 각각에서 데이터를 어떻게 불러올지 명확히 설계해야 함.
    - `getServerSideProps`, `getStaticProps`, 클라이언트 fetch, GraphQL/REST API 등 **데이터 접근 계층 설계**가 성능과 복잡성에 직결됨.
12. 사용자 경험(UX)과 지각 성능
    - 기술적 성능 외에도 **LCP(Largest Contentful Paint), TTFB(Time to First Byte), CLS(Cumulative Layout Shift)** 같은 **Core Web Vitals** 지표를 최적화하는 것이 목표.
    - SSR/SSG는 이 지표를 직접적으로 개선하는 도구이기도 함.
