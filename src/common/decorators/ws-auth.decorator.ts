import { GatewayGuard } from './../guards/gateway.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function WsAuth() {
  return applyDecorators(
    // UseGuards(),
    UseGuards(GatewayGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
