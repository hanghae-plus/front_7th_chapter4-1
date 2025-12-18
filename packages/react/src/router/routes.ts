import { HomePage, ProductDetailPage, NotFoundPage } from "../pages";

/**
 * 애플리케이션 라우트 설정
 *
 * 경로 패턴과 해당 페이지 컴포넌트를 매핑함
 *
 * - "/": 홈 페이지 (상품 목록)
 * - "/product/:id/": 상품 상세 페이지 (id는 경로 파라미터)
 * - "*": 404 페이지 (매칭되는 라우트가 없을 때)
 *
 * Router 생성자에 전달되어 라우팅 시스템에 등록됨
 */
export const routes = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  "*": NotFoundPage,
};
