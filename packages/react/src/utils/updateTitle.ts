import type { RouterInstance } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { productStore } from "../entities/products/productStore";

/**
 * 라우트 정보와 상품 데이터를 기반으로 title 문자열 생성
 */
export function generateTitle(
  routeInfo: { path: string; params?: Record<string, string> } | null,
  product: { title: string } | null,
): string {
  if (!routeInfo) {
    return "쇼핑몰";
  }

  if (routeInfo.path === "/product/:id/") {
    if (product?.title) {
      return `${product.title} - 쇼핑몰`;
    }
    return "상품 상세 - 쇼핑몰";
  } else if (routeInfo.path === "/") {
    return "쇼핑몰 - 홈";
  } else {
    return "404 - 쇼핑몰";
  }
}

/**
 * 현재 라우트에 따라 document.title 업데이트
 */
export function updateTitle(router: RouterInstance<FunctionComponent>) {
  if (typeof window === "undefined") return;

  const routeInfo = router.route;
  let product: { title: string } | null = null;

  if (routeInfo?.path === "/product/:id/") {
    const state = productStore.getState();
    product = state.currentProduct;
  }

  document.title = generateTitle(routeInfo, product);
}
