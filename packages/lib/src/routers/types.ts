import type { AnyFunction } from "../types";
import type { BaseRouter } from "./BaseRouter.ts";

export type RouterInstance<
  T extends AnyFunction = AnyFunction,
  R extends typeof BaseRouter<T> = typeof BaseRouter<T>,
> = InstanceType<R>;
