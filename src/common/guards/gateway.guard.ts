import { GatewayGuardOptions } from '@common/types/auth';
import { AuthService } from './../../modules/auth/auth.service';
import { OrganizationService } from './../../modules/organization/organization.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

const WS_GUARD_DEFAULT_OPTIONS = {
  user: true,
  organization: true,
};

@Injectable()
export class GatewayGuard implements CanActivate {
  private logger = new Logger('GatewayGuard');
  constructor(
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const options =
        this.reflector.get<GatewayGuardOptions>('wsGuardOptions', context.getHandler()) ??
        WS_GUARD_DEFAULT_OPTIONS;
      const client: Socket = context.switchToWs().getClient<Socket>();
      const accessToken: string = client.handshake.auth.accessToken as string;
      const organziationId: string = client.handshake.auth.organizationId as string;
      const user = await this.authService.validateAccessToken(accessToken);
      const organization = await this.organizationService.findOne({ _id: organziationId });

      context.switchToHttp().getRequest().user = user;
      context.switchToHttp().getRequest().organization = organization;

      const requireUser = options?.user ?? WS_GUARD_DEFAULT_OPTIONS.user;
      const requireOrganization = options?.organization ?? WS_GUARD_DEFAULT_OPTIONS.organization;

      return (
        (requireUser ? Boolean(user) : true) && (requireOrganization ? Boolean(organization) : true)
      );
    } catch (err) {
      throw new WsException(err.message);
    }
  }
}
