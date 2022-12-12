import { OrganizationService } from '@modules/organization/organization.service';
import { PopulateQuery } from '@common/types/mongoose';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@schemas/user.schema';
import { FilterQuery, Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly organizationService: OrganizationService,
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

  async findOneByEmailWithPassword(email: string) {
    return this.userModel
      .findOne({ 'credentials.email': { $regex: this.escapeRegExp(email), $options: 'i' } })
      .populate('password');
  }

  private escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
