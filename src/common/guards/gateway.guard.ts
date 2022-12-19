import { AuthService } from './../../modules/auth/auth.service';
import { OrganizationService } from './../../modules/organization/organization.service';
import { Organization } from './../../schemas/oraganization.schema';
import { UserService } from '@modules/user/user.service';
import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { User } from '@schemas/user.schema';
import { Socket } from 'socket.io';

@Injectable()
export class GatewayGuard implements CanActivate {
  private logger = new Logger('GatewayGuard');
  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken: string = client.handshake.headers.authorization;
      const organziationId: string = client.handshake.headers.organizationid as string;
      const user = await this.authService.validateAccessToken(authToken.split(' ')[1]);
      const organization = await this.organizationService.findOne({ _id: organziationId });

      this.logger.debug(
        `User ${user._id.toString()} reaching organization ${organization?._id?.toString()}`,
        'WsGuard',
      );
      context.switchToHttp().getRequest().user = user;
      context.switchToHttp().getRequest().organization = organization;

      this.logger.debug(
        `Can activate : ${Boolean(user) && Boolean(organization) ? 'YES' : 'NO'}`,
        'WsGuard',
      );

      return Boolean(user) && Boolean(organization);
    } catch (err) {
      throw new WsException(err.message);
    }
  }
}
