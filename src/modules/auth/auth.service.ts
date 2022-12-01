import { UserService } from '@modules/user/user.service';
import { User, UserDocument } from '@schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenResponse, ActiveAccount, AvailableOrganization } from './auth.type';
import { OrganizationService } from '@modules/organization/organization.service';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
  ) {}

  /**
   * Validate login name and password
   * @param email
   * @param password
   */
  async validate(email: string, password: string): Promise<User> {
    const account = await this.userService.findOneByEmailWithPassword(email);
    if (account && (await compare(password, account.password))) return account;
    return null;
  }

  async login(user: UserDocument): Promise<AccessTokenResponse> {
    if (!user) throw new NotFoundException();

    return {
      account: this.getActiveAccountInfo(user),
      accessToken: await this.generateAccessToken(user),
      organizations: await this.getAvailableOrganizations(user),
    };
  }

  /**
   * Generate access token for a given account
   * @param account
   */
  async generateAccessToken(account: UserDocument): Promise<string> {
    const expiresIn = this.configService.get<string>('app.accessTokenExpiration');
    return this.jwtService.sign(account.toObject(), {
      expiresIn,
    });
  }

  async validateAccessToken(token: string): Promise<User> {
    try {
      Logger.debug(`Validating access token ${token}`);
      const payload = await this.jwtService.verifyAsync(token);
      return await this.userService.findOne({ _id: payload._id });
    } catch (error) {
      Logger.error(error);
      return null;
    }
  }

  protected getActiveAccountInfo(user: UserDocument): ActiveAccount {
    const { _id, firstName, lastName, email } = user;
    return { _id, firstName, lastName, email };
  }

  protected async getAvailableOrganizations(user: UserDocument): Promise<AvailableOrganization[]> {
    Logger.debug(`Getting available organizations for user ${user._id}`);
    Logger.debug(JSON.stringify(user, null, 2));
    const organizations = await this.organizationService.find({
      _id: { $in: user.organizations },
    });
    return organizations.map((organization) => ({
      _id: organization._id,
      name: organization.name,
    }));
  }
}
