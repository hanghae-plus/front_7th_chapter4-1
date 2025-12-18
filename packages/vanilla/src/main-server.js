import { router } from "./router/router.js";

export const render = async (url) => {
  router.resolve(url);

  console.log("URL:", url);
  console.log("Route:", router.route);
  console.log("Params:", router.params);
  console.log("Target:", router.target);
  // TODO: Task 3에서 데이터 프리페칭 구현
  // TODO: Task 4에서 초기 데이터 주입 구현

  // 지금은 간단히 handler 호출 (에러 날 수 있음)
  // const html = router.target ? router.target() : "<div>Not Found</div>";

  try {
    const html = router.target ? router.target() : "<div>Not Found</div>";
    return { html, head: "" };
  } catch (error) {
    console.error("Render error:", error.message);
    return { html: "<div>Server Error</div>", head: "" };
  }
};
