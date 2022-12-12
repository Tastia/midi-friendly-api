import {
  InvitationType,
  InvitationTargetApp,
  AuthPayload,
  EmailCredentials,
} from '@common/types/auth';
import { UserService } from '@modules/user/user.service';
import { User, UserDocument } from '@schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenResponse, ActiveAccount, AvailableOrganization } from './auth.type';
import { OrganizationService } from '@modules/organization/organization.service';
import { compare } from 'bcrypt';
import { Invitation, InvitationDocument } from '@schemas/invitation.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateInvitationLinkDto } from './dto/create-invitation-link.dtp';
import { comparePassword } from '@shared/utils/hash-password';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Invitation.name)
    private readonly invitationModel: Model<InvitationDocument>,
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

  async createBatchInvitationLink(invitationConfig: CreateInvitationLinkDto) {
    const invitation = await this.invitationModel.create({
      type: InvitationType.Link,
      organization: invitationConfig.organizationId,
      expireAt: new Date(invitationConfig.expireAt).setHours(23, 59, 59, 999),
      maxUsage: invitationConfig.maxUsage,
      targetApp: invitationConfig.targetApp,
      usage: [],
    });

    return (
      this.configService.get<string>(
        invitationConfig.targetApp === InvitationTargetApp.Admin
          ? 'app.appUrls.admin'
          : 'app.appUrls.client',
      ) + `/invitation/${invitation._id}`
    );
  }

  async getInvitationData(invitationId: string, emailHash?: string) {
    const invitation = await this.invitationModel
      .findOne({
        _id: invitationId,
      })
      .populate({ path: 'organization', select: 'name' });
    if (
      !invitation ||
      (invitation.type === 'email' &&
        (!emailHash || !invitation.emails.some((email) => comparePassword(email, emailHash))))
    )
      throw new NotFoundException();

    const maxUsageReached = (invitation.usage?.length ?? 0) >= invitation.maxUsage;
    const alreadyUsed = invitation.usage.some((item) => comparePassword(item.email, emailHash));
    const expired = invitation.expireAt < new Date();

    if (maxUsageReached || alreadyUsed || expired)
      return {
        success: false,
        maxUsageReached,
        alreadyUsed,
        expired,
      };

    return {
      success: true,
      invitation: {
        _id: invitation._id,
        type: invitation.type,
        ...(invitation.targetApp === InvitationTargetApp.Client && {
          organization: invitation.organization,
        }),
      },
    };
  }

  async acceptInvitation(invitationId: string, email: string) {}

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
