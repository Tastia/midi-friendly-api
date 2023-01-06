import { RequesterApp } from './../../common/decorators/app.decorator';
import { AuthService } from '@modules/auth/auth.service';
import { Invitation, InvitationDocument } from '@schemas/invitation.schema';
import { Organization, OrganizationDocument } from '@schemas/oraganization.schema';
import {
  AuthPayload,
  InvitationTargetApp,
  InvitationType,
  RegisterAccountPayload,
} from '@common/types/auth';
import { PopulateQuery } from '@common/types/mongoose';
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@schemas/user.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  PaginatedQuery,
  MongooseSearchService,
  SearchPaginateModel,
} from '@chronicstone/mongoose-search';
import {} from 'nestjs-asyncapi';
import { comparePassword, hashPassword } from '@shared/utils/hash-password';
import { AcceptInvitationDto } from '@modules/auth/dto/accept-invitation.dto';
import { QueueEmailsOperation, Queues } from '@common/types/queue.type';
import { InviteUsersByEmailDto } from '@modules/auth/dto/invite-users-by-email.dto';
import { CreateInvitationLinkDto } from '@modules/auth/dto/create-invitation-link.dto';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '@modules/services/queue/queue.service';
import { ValidateInvitationDto } from '@modules/auth/dto/validate-invitation.dto';
import { LunchGroupService } from '@modules/lunch-group/lunch-group.service';
import { UserDto } from '@modules/lunch-group/dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(User.name) private readonly usersPaginatedModel: SearchPaginateModel<UserDocument>,
    @InjectModel(Invitation.name) private readonly invitationModel: Model<InvitationDocument>,
    private readonly searchService: MongooseSearchService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly authService: AuthService,
    private readonly lunchGroupService: LunchGroupService,
  ) {}

  async registerUser(payload: RegisterAccountPayload) {
    const credentialsExist = await this.userModel.findOne({
      'credentials.email': payload.email,
      'credentials.type': payload.type,
    });

    if (credentialsExist) throw new BadRequestException('User already exists');

    return this.userModel.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      avatar: payload.avatar,
      credentials: {
        type: payload.type,
        email: payload.email,
        ...(payload.type === 'email' && { password: payload.password }),
        ...(payload.type !== 'email' && { userId: payload.userId }),
      },
      organizations: [],
      onboarding: { mapsApp: false, adminApp: false },
    });
  }

  find(filter?: FilterQuery<UserDocument>, populate?: PopulateQuery) {
    return this.userModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  findOne(filter?: FilterQuery<UserDocument>, populate?: PopulateQuery) {
    return this.userModel.findOne(filter ?? {}).populate(populate ?? ('' as any));
  }

  updateOne(filter: FilterQuery<UserDocument>, update: Partial<UserDocument>) {
    return this.userModel.updateOne(filter, update);
  }

  deleteOne(filter: FilterQuery<UserDocument>) {
    return this.userModel.deleteOne(filter);
  }

  list(query: PaginatedQuery, countOnly: boolean) {
    const lookup = [
      {
        $lookup: {
          from: 'organizations',
          localField: 'organizations',
          foreignField: '_id',
          as: 'organizations',
        },
      },
    ];

    return this.searchService.search(this.usersPaginatedModel, query, lookup, countOnly);
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
        ? await this.authService.validate(account.linkPayload as AuthPayload, false)
        : await this.registerUser(account.registerPayload as RegisterAccountPayload);

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

  async completeOnboarding(user: User, app: RequesterApp) {
    return this.userModel.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          onboarding: {
            ...user.onboarding,
            ...(app === 'admin' && { adminApp: true }),
            ...(app === 'client' && { mapsApp: true }),
          },
        },
      },
    );
  }
}
