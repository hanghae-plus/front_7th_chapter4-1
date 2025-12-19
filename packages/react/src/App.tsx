import { useEffect } from "react";
import { useRouter } from "@hanghae-plus/lib";
import { useCurrentPage, useRouterParams, useRouterQuery } from "./router";
import { useRouterContext } from "./router/hooks/useRouterContext";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";

/**
 * CartInitializer 컴포넌트
 *
 * 애플리케이션 초기화 시 장바구니 스토어를 로드함
 * localStorage에서 장바구니 데이터를 복원하는 역할
 *
 * @returns null (렌더링되는 UI 없음)
 */
const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * TitleUpdater 컴포넌트
 *
 * 라우트 변경 시 페이지 title을 업데이트함
 * 페이지 컴포넌트의 metadata 함수에서 title을 가져와서 document.title을 업데이트
 *
 * 같은 페이지 컴포넌트로 이동할 때도 (예: /product/1/ → /product/2/)
 * 라우터 params 변경을 감지하여 타이틀을 업데이트함
 */
const TitleUpdater = () => {
  const router = useRouterContext();
  const PageComponent = useCurrentPage();

  // 라우터의 route.path를 구독하여 라우트 변경 감지
  // route.path는 라우트가 변경될 때만 변경되므로 안정적
  const routePath = useRouter(router, (r) => r.route?.path || "");

  // 라우터의 params와 query를 한 번만 구독
  // useRouterParams와 useRouterQuery는 useShallowSelector를 사용하므로 안정적인 참조를 보장
  const routerParams = useRouterParams();
  const routerQuery = useRouterQuery();

  // params에서 id만 추출하여 의존성 배열에 사용 (객체 참조 변경 방지)
  const productId = routerParams?.id;

  useEffect(() => {
    if (!PageComponent) return;

    // 페이지 컴포넌트에 metadata 함수가 있는지 확인
    const updateTitle = async () => {
      try {
        const metadata = (
          PageComponent as {
            metadata?: (params?: {
              pathname?: string;
              query?: Record<string, string>;
              params?: Record<string, string>;
            }) => Promise<{ title?: string }>;
          }
        )?.metadata;
        if (metadata) {
          const params = {
            pathname: typeof window !== "undefined" ? window.location.pathname : "",
            query: routerQuery || {},
            params: routerParams || {},
          };
          const result = await metadata(params);
          if (result?.title) {
            document.title = result.title;
          }
        }
      } catch (error) {
        console.error("Failed to update title:", error);
      }
    };

    updateTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PageComponent, productId, routePath]); // PageComponent, productId, routePath 변경 시 실행 (routerParams, routerQuery는 useShallowSelector로 안정적이지만 무한 루프 방지를 위해 제외)

  return null;
};

/**
 * App 컴포넌트
 *
 * 전체 애플리케이션의 루트 컴포넌트
 *
 * 주요 기능:
 * - 현재 라우트에 맞는 페이지 컴포넌트 렌더링
 * - ToastProvider로 토스트 알림 기능 제공
 * - ModalProvider로 모달 기능 제공
 * - CartInitializer로 장바구니 초기화
 * - TitleUpdater로 페이지 title 업데이트
 *
 * @returns 애플리케이션 UI
 */
export const App = () => {
  // 현재 라우트에 매칭된 페이지 컴포넌트 가져오기
  const PageComponent = useCurrentPage();

  return (
    <>
      {/* 토스트 알림을 위한 Provider */}
      <ToastProvider>
        {/* 모달을 위한 Provider */}
        <ModalProvider>
          {/* 페이지 title 업데이트 (렌더링되는 UI 없음) */}
          <TitleUpdater />
          {/* 현재 페이지 컴포넌트 렌더링 (없으면 null) */}
          {PageComponent ? <PageComponent /> : null}
        </ModalProvider>
      </ToastProvider>
      {/* 장바구니 초기화 (렌더링되는 UI 없음) */}
      <CartInitializer />
    </>
  );
};
