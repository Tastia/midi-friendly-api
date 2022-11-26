import { AuthService } from './../../modules/auth/auth.service';
import { OrganizationService } from './../../modules/organization/organization.service';
import { Organization } from './../../schemas/oraganization.schema';
import { UserService } from '@modules/user/user.service';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { User } from '@schemas/user.schema';
import { Socket } from 'socket.io';

@Injectable()
export class GatewayGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken: string = client.handshake.headers.authorization;
      const organziationId: string = client.handshake.headers.organizationId as string;
      const user = await this.authService.validateAccessToken(authToken.split(' ')[1]);
      const organization = await this.organizationService.findOne({ _id: organziationId });
      context.switchToHttp().getRequest().user = user;
      context.switchToHttp().getRequest().organization = organization;

      return Boolean(user) && Boolean(organization);
    } catch (err) {
      throw new WsException(err.message);
    }
  }
}
