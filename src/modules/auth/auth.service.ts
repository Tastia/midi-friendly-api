import { LunchGroupService } from '@modules/lunch-group/lunch-group.service';
import { InviteUsersByEmailDto } from './dto/invite-users-by-email.dto';
import { AuthProviders, ProviderCredentials, RegisterAccountPayload } from '@common/types/auth';
import { InvitationType, InvitationTargetApp, AuthPayload } from '@common/types/auth';
import { UserService } from '@modules/user/user.service';
import { User, UserDocument } from '@schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenResponse, ActiveAccount, AvailableOrganization } from './auth.type';
import { OrganizationService } from '@modules/organization/organization.service';
import { compare } from 'bcrypt';
import { Invitation, InvitationDocument } from '@schemas/invitation.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateInvitationLinkDto } from './dto/create-invitation-link.dto';
import { comparePassword, hashPassword } from '@shared/utils/hash-password';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { QueueEmailsOperation, Queues } from '@common/types/queue.type';
import { QueueService } from '@modules/services/queue/queue.service';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';
import { UserDto } from '@modules/lunch-group/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Invitation.name)
    private readonly invitationModel: Model<InvitationDocument>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly queueService: QueueService,
    private readonly lunchGroupService: LunchGroupService,
  ) {}

  async validate(payload: AuthPayload, adminAuth: boolean): Promise<UserDocument> {
    const account = await this.userService.findOneByEmailWithSecret(payload.email, payload.type);
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
      return await this.userService.findOne({ _id: payload._id });
    } catch (error) {
      Logger.error(error);
      return null;
    }
  }

  async createInvitationLink(invitationConfig: CreateInvitationLinkDto) {
    const invitation = await (
      await this.invitationModel.create({
        type: InvitationType.Link,
        organization: invitationConfig.organizationId,
        expireAt: new Date(invitationConfig.expireAt).setHours(23, 59, 59, 999),
        maxUsage: invitationConfig.maxUsage,
        targetApp: invitationConfig.targetApp,
        usage: [],
      })
    ).populate('organization');

    return (
      this.configService.get<string>(
        invitationConfig.targetApp === InvitationTargetApp.Admin
          ? 'app.appUrls.admin'
          : 'app.appUrls.client',
      ) + `/auth/invitation/${invitation._id}`
    );
  }

  async inviteUsersByEmail(invitationConfig: InviteUsersByEmailDto) {
    const invitation = await this.invitationModel.create({
      type: InvitationType.Email,
      organization: invitationConfig.organizationId,
      expireAt: new Date(invitationConfig.expireAt).setHours(23, 59, 59, 999),
      targetApp: invitationConfig.targetApp,
      emails: invitationConfig.emails,
      usage: [],
    });

    const rawLink =
      this.configService.get<string>(
        invitationConfig.targetApp === InvitationTargetApp.Admin
          ? 'app.appUrls.admin'
          : 'app.appUrls.client',
      ) + `/auth/invitation/${invitation._id}`;

    this.queueService.add({
      queueName: Queues.MailQueue,
      jobData: {
        operation: QueueEmailsOperation.InviteUser,
        params: invitationConfig.emails.map((email) => ({
          email,
          invitationLink: rawLink + `?hash=${encodeURIComponent(hashPassword(email))}`,
          expireAt: invitationConfig.expireAt,
          organization: invitation?.organization?.name ?? null,
        })),
      },
    });

    return invitation;
  }

  async getInvitationData({ invitationId, emailHash }: ValidateInvitationDto) {
    Logger.debug(`Validating invitation ${invitationId} with email hash ${emailHash}`);
    const invitation = await this.invitationModel
      .findOne({
        _id: invitationId,
      })
      .populate({ path: 'organization', select: 'name' });

    Logger.debug(`Invitation found: ${JSON.stringify(invitation, null, 2)}`);

    if (
      !invitation ||
      (invitation.type === 'email' &&
        (!emailHash || !invitation.emails.some((email) => comparePassword(email, emailHash))))
    )
      return {
        success: false,
        notFound: true,
      };

    const unhashedEmail = !emailHash
      ? null
      : invitation.emails?.find?.((email) => comparePassword(email, emailHash)) ?? '';
    const maxUsageReached = (invitation.usage?.length ?? 0) >= invitation.maxUsage;
    const expired = invitation.expireAt < new Date();
    const alreadyUsed = !emailHash
      ? false
      : invitation.usage.some((item) => comparePassword(item.email, emailHash));

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

  async acceptInvitation({ invitationId, emailHash, account }: AcceptInvitationDto) {
    const invitation = await this.invitationModel
      .findOne({ _id: invitationId })
      .populate('organization');

    if (
      !invitation ||
      (invitation.type === 'email' &&
        (!emailHash || !invitation.emails.some((email) => comparePassword(email, emailHash))))
    )
      throw new NotFoundException();

    const unhashedEmail = !emailHash
      ? null
      : invitation.emails?.find?.((email) => comparePassword(email, emailHash)) ?? '';
    const maxUsageReached = (invitation.usage?.length ?? 0) >= invitation.maxUsage;
    const expired = invitation.expireAt < new Date();
    const alreadyUsed = !emailHash
      ? false
      : invitation.usage.some((item) => comparePassword(item.email, emailHash));

    if (maxUsageReached || alreadyUsed || expired)
      return {
        success: false,
        maxUsageReached,
        alreadyUsed,
        expired,
      };

    const user =
      account.mode === 'link'
        ? await this.validate(account.linkPayload as AuthPayload, false)
        : await this.userService.registerUser(account.registerPayload as RegisterAccountPayload);

    if (!user) throw new NotFoundException('User not found');
    if (user.organizations.some((org) => org._id === invitation.organization._id))
      throw new BadRequestException('User already in organization');

    user.organizations.push(invitation.organization);
    user.markModified('organizations');

    invitation.usage.push({
      _id: new Types.ObjectId(),
      linkedAccount: user,
      usageDate: new Date(),
      ...(invitation.type === 'email' && { email: unhashedEmail }),
    });
    invitation.markModified('usage');

    await Promise.all([user.save(), invitation.save()]);
    if (invitation.organization) {
      const userData = user.toObject();
      this.lunchGroupService.addUserToOrganization(invitation.organization._id.toString(), {
        ...userData,
        credentials: {
          email: userData.credentials.email,
          type: userData.credentials.type,
        },
      } as unknown as UserDto);
    }
    return { success: true };
  }

  protected getActiveAccountInfo(user: UserDocument, adminApp: boolean): ActiveAccount {
    const { _id, firstName, lastName, email, avatar, admin } = user;
    return { _id, firstName, lastName, email, avatar, admin };
  }

  protected async getAvailableOrganizations(
    user: UserDocument,
    admin: boolean,
  ): Promise<AvailableOrganization[]> {
    Logger.debug(`Getting available organizations for user ${user._id}`);
    const organizations = await this.organizationService.find({
      _id: { $in: admin ? user.adminOrganizations : user.organizations },
    });
    return organizations.map((organization) => ({
      _id: organization._id,
      name: organization.name,
      address: organization.address,
      coordinates: organization.coordinates,
    }));
  }
}
