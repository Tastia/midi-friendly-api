import { WsException } from '@nestjs/websockets';
import { Organization } from '@schemas/oraganization.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Organization => {
    const request = ctx.switchToHttp().getRequest();
    return request.organization;
  },
);
