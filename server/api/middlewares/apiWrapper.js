// @flow
import { type Context } from 'koa';

export default function apiWrapper() {
  return async function apiWrapperMiddleware(
    ctx: Context,
    next: () => Promise<void>
  ) {
    await next();

    const ok = ctx.status < 400;

    if (typeof ctx.body !== 'string') {
      // $FlowFixMe
      ctx.body = {
        ...ctx.body,
        status: ctx.status,
        ok,
      };
    }
  };
}
