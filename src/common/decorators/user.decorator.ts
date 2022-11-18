import { User } from '@schemas/user.schema';
import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  if (request.user) throw new BadRequestException('User not found');
  return request.user;
});
