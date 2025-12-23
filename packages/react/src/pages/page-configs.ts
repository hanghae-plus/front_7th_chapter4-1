import type { Categories, Product } from "../entities";
import { getCategories, getProduct, getProducts } from "../api/productApi";
import { PRODUCT_ACTIONS, productStore } from "../entities/products/productStore";

interface SSRContext {
  params: Record<string, string>;
  query: Record<string, string>;
}

interface ServerSidePropsResult {
  props?: Record<string, unknown>;
  head?: { title: string; description: string };
  notFound?: boolean;
}

interface PageConfig {
  getServerSideProps?: (ctx: SSRContext) => Promise<ServerSidePropsResult>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeStoreFromSSR?: (data: any) => void;
}

interface HomePageProps {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

async function getHomeServerSideProps(ctx: SSRContext): Promise<ServerSidePropsResult> {
  const [productsRes, categories] = await Promise.all([getProducts(ctx.query), getCategories()]);

  return {
    props: {
      products: productsRes.products,
      categories,
      totalCount: productsRes.pagination.total,
    },
    head: {
      title: "쇼핑몰 - 홈",
      description: `${productsRes.pagination.total}개 상품`,
    },
  };
}

function initializeHomeStore(data: HomePageProps): void {
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      products: data.products,
      categories: data.categories,
      totalCount: data.totalCount,
      loading: false,
      status: "done",
    },
  });
}

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

async function getProductDetailServerSideProps(ctx: SSRContext): Promise<ServerSidePropsResult> {
  const { id } = ctx.params;

  if (!id) {
    return { notFound: true };
  }

  try {
    const product = await getProduct(id);

    let relatedProducts: Product[] = [];
    if (product.category2) {
      const relatedRes = await getProducts({
        category2: product.category2,
        limit: "20",
        page: "1",
      });
      relatedProducts = relatedRes.products.filter((p) => p.productId !== id);
    }

    return {
      props: {
        product,
        relatedProducts,
      },
      head: {
        title: `${product.title} - 쇼핑몰`,
        description: `${product.title} 상품 상세`,
      },
    };
  } catch {
    return { notFound: true };
  }
}

function initializeProductDetailStore(data: ProductDetailProps): void {
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      currentProduct: data.product,
      relatedProducts: data.relatedProducts,
      loading: false,
      status: "done",
    },
  });
}

async function getNotFoundServerSideProps(): Promise<ServerSidePropsResult> {
  return {
    props: {},
    head: {
      title: "페이지를 찾을 수 없습니다",
      description: "404 Not Found",
    },
  };
}

export const pageConfigs: Record<string, PageConfig> = {
  "/": {
    getServerSideProps: getHomeServerSideProps,
    initializeStoreFromSSR: initializeHomeStore,
  },
  "/product/:id/": {
    getServerSideProps: getProductDetailServerSideProps,
    initializeStoreFromSSR: initializeProductDetailStore,
  },
  "/404": {
    getServerSideProps: getNotFoundServerSideProps,
  },
};

export type { SSRContext, ServerSidePropsResult, PageConfig, HomePageProps, ProductDetailProps };
