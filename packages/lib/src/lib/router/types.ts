export interface Runtime {
  getHref(): string;
  push?(href: string): void;
  onChange?(cb: () => void): () => void;
  setHref?(href: string): void;
  setupClickHandler?(cb: (url: string) => void): void; // for browser runtime
}
export type StringRecord = Record<string, string>;
