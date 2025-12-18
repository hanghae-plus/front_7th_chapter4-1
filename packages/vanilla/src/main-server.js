export const render = async (url, query) => {
  console.log({ url, query });

  // 1. Store 초기화
  // 2. 라우트 매칭
  // 3. 데이터 프리페칭
  // 4. HTML 생성

  return {
    html: "<div>안녕하세요</div>",
    head: "<title>Vanilla Javascript SSR</title>",
    initialDataScript: "<script>console.log('initialData')</script>",
  };
};
