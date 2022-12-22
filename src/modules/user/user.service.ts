import { RegisterAccountPayload } from '@common/types/auth';
import { OrganizationService } from '@modules/organization/organization.service';
import { PopulateQuery } from '@common/types/mongoose';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@schemas/user.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import {
  PaginatedQuery,
  MongooseSearchService,
  SearchPaginateModel,
} from '@chronicstone/mongoose-search';
import {} from 'nestjs-asyncapi';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly organizationService: OrganizationService,
    private readonly searchService: MongooseSearchService,
    @InjectModel(User.name) private readonly usersPaginatedModel: SearchPaginateModel<UserDocument>,
  ) {}

  async create(newUser: CreateUserDto) {
    const organization = await this.organizationService.findOne({ _id: newUser.organization });
    if (await this.userModel.findOne({ email: newUser.email }))
      throw new BadRequestException(`User ${newUser.email} already exists`);
    if (!organization)
      throw new NotFoundException(`Organization ${newUser.organization} not found`);

    const user = await this.userModel.create({
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password,
      organization: [],
    });

    user.organizations.push(organization);
    await user.save();
    return user;
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

  findOneByEmailWithSecret(email: string, credentialType: 'email' | 'google' | 'facebook') {
    return this.userModel
      .findOne({
        'credentials.email': { $regex: this.escapeRegExp(email), $options: 'i' },
        'credentials.type': credentialType,
      })
      .populate(['credentials.password', 'credentials.userId', 'organizations']);
  }

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
    });
  }

  private escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
}
