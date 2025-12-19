import { BASE_URL } from "../constants";
import { type ComponentProps, memo } from "react";

/**
 * PublicImage 컴포넌트
 * BASE_URL을 사용하여 정적 리소스 경로를 올바르게 조합함
 * SSR/SSG와 클라이언트 모두에서 일관된 경로를 보장하기 위해 constants.ts의 BASE_URL 사용
 */
export const PublicImage = memo(({ src, ...props }: ComponentProps<"img">) => {
  // constants.ts의 BASE_URL 사용 (SSR/SSG와 클라이언트 모두에서 일관성 보장)
  // BASE_URL은 항상 /로 시작하고 /로 끝남 (예: "/front_7th_chapter4-1/react/" 또는 "/")
  const baseUrl = BASE_URL;

  // src가 이미 절대 경로로 시작하는 경우 (/로 시작)
  // baseUrl과 조합할 때 중복 슬래시 방지
  const normalizedSrc = src.startsWith("/") ? src.slice(1) : src;

  // baseUrl은 항상 /로 끝나고, normalizedSrc는 /로 시작하지 않으므로 안전하게 조합
  const url = `${baseUrl}${normalizedSrc}`;

  return <img src={url} {...props} />;
});

PublicImage.displayName = "PublicImage";
