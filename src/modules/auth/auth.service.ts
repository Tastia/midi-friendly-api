import { Organization, OrganizationDocument } from '@schemas/oraganization.schema';
import { AuthProviders, ProviderCredentials } from '@common/types/auth';
import { AuthPayload } from '@common/types/auth';
import { User, UserDocument } from '@schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenResponse, ActiveAccount, AvailableOrganization } from './auth.type';
import { compare } from 'bcrypt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async validate(payload: AuthPayload, adminAuth: boolean): Promise<UserDocument> {
    const account = await this.findUserByEmailWithSecret(payload.email, payload.type);
    if (adminAuth && !account.admin) throw new UnauthorizedException('Accès non autorisé');
    if (
      account &&
      account.credentials.type === 'email' &&
      payload.type === 'email' &&
      (await compare(payload.password, account.credentials.password))
    )
      return account;

    if (
      account &&
      Object.values(AuthProviders).includes(payload.type as AuthProviders) &&
      (await compare(payload.userId, (account.credentials as ProviderCredentials).userId))
    )
      return account;

    return null;
  }

  async login(user: UserDocument, admin: boolean): Promise<AccessTokenResponse> {
    if (!user) throw new NotFoundException();

    if (admin && !user.admin && !user.adminOrganizations.length)
      throw new UnauthorizedException('Accès non autorisé');

    return {
      account: this.getActiveAccountInfo(user, admin),
      accessToken: await this.generateAccessToken(user, admin),
      organizations: await this.getAvailableOrganizations(user, admin),
    };
  }

  findUserByEmailWithSecret(email: string, credentialType: 'email' | 'google' | 'facebook') {
    return this.userModel
      .findOne({
        'credentials.email': { $regex: this.escapeRegExp(email), $options: 'i' },
        'credentials.type': credentialType,
      })
      .populate(['credentials.password', 'credentials.userId', 'organizations']);
  }

  /**
   * Generate access token for a given account
   * @param account
   */
  async generateAccessToken(account: UserDocument, admin: boolean): Promise<string> {
    const expiresIn = this.configService.get<string>('app.accessTokenExpiration');
    return this.jwtService.sign(account.toObject(), {
      expiresIn,
    });
  }

  async validateAccessToken(token: string, throwOnErr = true): Promise<User> {
    try {
      Logger.debug(`Validating access token ${token}`);
      const payload = throwOnErr
        ? await this.jwtService.verifyAsync(token)
        : this.jwtService.decode(token);
      return await this.userModel.findOne({ _id: payload._id });
    } catch (error) {
      Logger.error(error);
      return null;
    }
  }

  protected getActiveAccountInfo(user: UserDocument, adminApp: boolean): ActiveAccount {
    const { _id, firstName, lastName, email, avatar, admin } = user;
    return {
      _id,
      firstName,
      lastName,
      email,
      avatar,
      admin,
      onboarded: adminApp ? user.onboarding?.adminApp ?? false : user.onboarding?.mapsApp ?? false,
    };
  }

  protected async getAvailableOrganizations(
    user: UserDocument,
    admin: boolean,
  ): Promise<AvailableOrganization[]> {
    Logger.debug(`Getting available organizations for user ${user._id}`);
    const organizations = await this.organizationModel.find({
      _id: { $in: admin ? user.adminOrganizations : user.organizations },
    });
    return organizations.map((organization) => ({
      _id: organization._id,
      name: organization.name,
      address: organization.address,
      coordinates: organization.coordinates,
    }));
  }

  private escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
