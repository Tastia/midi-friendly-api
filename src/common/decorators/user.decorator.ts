import { User } from '@schemas/user.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
