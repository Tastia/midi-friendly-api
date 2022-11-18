import { Organization } from '@schemas/oraganization.schema';
import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveOrganization = createParamDecorator((data: unknown, ctx: ExecutionContext): Organization => {
  const request = ctx.switchToHttp().getRequest();
  if (request.organization) throw new BadRequestException('Organization not found');
  return request.organization;
});
