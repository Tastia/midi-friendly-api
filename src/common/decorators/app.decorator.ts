import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export type RequesterApp = 'admin' | 'client';

export const CurrentApp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequesterApp => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-application'];
  },
);
