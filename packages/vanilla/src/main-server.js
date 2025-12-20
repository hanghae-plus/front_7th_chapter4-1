import { createServerRouter, registerRoutes } from "./router/router.js";
import { routes } from "./router/routes.js";

export const render = async (url) => {
  const [rawPathname, search] = url.split("?");
  // pathname이 /로 시작하도록 정규화
  const pathname = rawPathname.startsWith("/") ? rawPathname : "/" + rawPathname;
  const query = Object.fromEntries(new URLSearchParams(search || ""));

  const router = createServerRouter();
  registerRoutes(router, routes); // 여기서 등록
  router.setServerUrl(pathname, search);

  // 라우트 매칭 (router.start() 대신 직접 찾기)
  const route = router.matchRoute(pathname); //   // 이제 라우트가 등록되어 있음

  if (!route) {
    return { head: "<title>404</title>", html: "<div>Not Found</div>" };
  }

  // 데이터 프리패칭
  let props = {};
  if (route.handler.getServerSideProps) {
    props = await route.handler.getServerSideProps({
      params: route.params,
      query,
    });
  }

  // 타이틀 결정 (props에서 동적 타이틀 또는 라우트 기본 타이틀)
  const title = props.title || route.handler.title || "쇼핑몰";

  // HTML 렌더링
  const html = route.handler.component(props);

  // 클라이언트 hydration용 초기 데이터
  const head = `
    <title>${title}</title>
    <script>window.__INITIAL_DATA__ = ${JSON.stringify(props)};</script>
  `;

  return { head, html };
};

/**
 * render 함수의 역할?
 * 페이지를 렌더링해주면 됨
 */
