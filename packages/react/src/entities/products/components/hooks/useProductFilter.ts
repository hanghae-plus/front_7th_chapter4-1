import { useEffect, useRef, useState } from "react";
import { loadProducts } from "../../productUseCase";
import { productStore } from "../../productStore";
import { router } from "../../../../router";
import { useQueryContext } from "../../../../contexts/QueryContext";

// 서버 환경 확인
const isServer = typeof window === "undefined";

// URL에서 쿼리 파라미터 파싱
const parseQuery = () => {
  if (isServer) return {};
  const params = new URLSearchParams(window.location.search);
  const query: Record<string, string> = {};
  params.forEach((value, key) => {
    query[key] = value;
  });
  return query;
};

export const useProductFilter = () => {
  // SSR용 QueryContext에서 쿼리 가져오기
  const { query: ssrQuery } = useQueryContext();

  // CSR에서 URL 변경 감지를 위한 state
  const [urlQuery, setUrlQuery] = useState<Record<string, string>>(parseQuery);

  // URL 변경 감지 효과
  useEffect(() => {
    if (isServer) return;

    const handleUrlChange = () => {
      setUrlQuery(parseQuery());
    };

    // router 구독
    const unsubscribe = router.subscribe(handleUrlChange);

    // popstate 이벤트도 구독
    window.addEventListener("popstate", handleUrlChange);

    return () => {
      unsubscribe();
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  // 서버에서는 ssrQuery 사용, 클라이언트에서는 urlQuery 사용
  const query = isServer ? ssrQuery : urlQuery;

  const searchQuery = query.search || query.query || "";
  const limit = query.limit || "20";
  const sort = query.sort || "price_asc";
  const category1 = query.category1 || "";
  const category2 = query.category2 || "";
  const current = query.current || "1";

  const category = { category1, category2 };

  const didMount = useRef(false);
  const prevCurrentRef = useRef(current);

  useEffect(() => {
    // 서버에서는 실행하지 않음
    if (isServer) return;

    const state = productStore.getState();

    // 첫 마운트 시 SSR 데이터가 있으면 스킵
    if (!didMount.current) {
      didMount.current = true;
      if (state.products.length > 0 && state.status === "done") {
        prevCurrentRef.current = current;
        return;
      }
    }

    // current만 변경된 경우 (무한 스크롤) 스킵 - loadMoreProducts에서 직접 처리함
    if (prevCurrentRef.current !== current) {
      prevCurrentRef.current = current;
      // 다른 필터는 변경되지 않았으면 스킵
      return;
    }

    // 현재 쿼리를 직접 전달
    const currentQuery = {
      search: searchQuery,
      limit,
      sort,
      category1,
      category2,
      current: "1", // 필터 변경 시 항상 첫 페이지로
    };
    loadProducts(true, currentQuery);
  }, [searchQuery, limit, sort, category1, category2, current]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
