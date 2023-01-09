import { GatewayGuardOptions } from '@common/types/auth';
import { GatewayGuard } from './../guards/gateway.guard';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function WsAuth(guardOptions?: GatewayGuardOptions) {
  return applyDecorators(
    SetMetadata('wsGuardOptions', guardOptions),
    UseGuards(GatewayGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
}
