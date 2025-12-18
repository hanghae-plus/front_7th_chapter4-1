import type { StringRecord } from "@hanghae-plus/lib";

export type Categories = Record<string, Record<string, string | StringRecord>>;

export interface Product {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3?: string;
  category4?: string;
}
