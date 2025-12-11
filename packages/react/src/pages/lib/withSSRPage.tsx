import type { ComponentType } from "react";
import type { RouterInstance } from "@hanghae-plus/lib";

interface Option {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getServerProps?: (router: RouterInstance) => Promise<Record<string, any> & { head: string }>;
}

export const withSSRPage = <P extends Record<string, unknown>>(PageComponent: ComponentType<P>, option: Option) => {
  const WithSSRPage = (props: P) => {
    return <PageComponent {...props} />;
  };

  const displayName = PageComponent.displayName || PageComponent.name || "Component";
  WithSSRPage.displayName = `withSSRPage(${displayName})`;

  return Object.assign(WithSSRPage, {
    getServerProps: async () => ({
      head: "<title>오류입니다</title>",
    }),
    ...option,
  });
};
