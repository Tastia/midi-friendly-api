import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AccessGuard } from '@common/guards/access.guard';

export function JWTAuth() {
  return applyDecorators(
    // UseGuards(),
    UseGuards(AuthGuard('jwt'), AccessGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
