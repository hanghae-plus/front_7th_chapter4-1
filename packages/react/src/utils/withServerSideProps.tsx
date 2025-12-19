import type { StringRecord } from "@hanghae-plus/lib";
import type { FC } from "react";

interface ServerParams {
  query: StringRecord;
  params: StringRecord;
}

interface ServerConfig {
  ssr?: (params: ServerParams) => Promise<unknown>;
  metadata?: (params: ServerParams) => Promise<{ title: string }>;
}

export interface PageWithServer<P = Record<string, unknown>> extends FC<P>, ServerConfig {}

export const withServerSideProps = <P extends Record<string, unknown>>(
  serverOptions: ServerConfig,
  Component: FC<P>,
) => {
  const Page: PageWithServer<P> = (props: P) => <Component {...props} />;

  Object.assign(Page, serverOptions);

  return Page;
};
