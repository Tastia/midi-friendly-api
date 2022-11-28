import { WsException } from '@nestjs/websockets';
import { Organization } from '@schemas/oraganization.schema';
import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  Logger,
} from '@nestjs/common';

export const ActiveOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Organization => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.organization) throw new WsException('Organization not found');
    return request.organization;
  },
);
