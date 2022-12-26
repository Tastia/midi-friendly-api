import { AuthService } from '@modules/auth/auth.service';
import { OrganizationService } from '@modules/organization/organization.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Access guard for Nest authentication mechanism
 */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Check if this method can be activated with given execution context
   * @param context
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const organizationId = context.switchToHttp().getRequest().headers.organizationid;
    const authToken = context.switchToHttp().getRequest().headers.authorization;
    const user = await this.authService.validateAccessToken(authToken.split(' ')[1]);
    const organization = await this.organizationService.findOne({ _id: organizationId });

    context.switchToHttp().getRequest().user = user;
    context.switchToHttp().getRequest().organization = organization;

    return true;
  }
}
