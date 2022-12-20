import { LunchGroupEmittedEvents } from './../../common/types/lunchGroup';
import { UpdatedGroupData } from './pub-dto/update-group.dto';
import { CreateGroupDto } from './pub-dto/create-group.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LunchGroup, LunchGroupDocument } from '@schemas/lunchGroup.schema';
import { User, UserDocument } from '@schemas/user.schema';
import { FilterQuery, Model } from 'mongoose';
import { Organization } from '@schemas/oraganization.schema';
import { PopulateQuery } from '@common/types/mongoose';
import { Server } from 'socket.io';
import { UserDto } from './dto/user.dto';

@Injectable()
export class LunchGroupService {
  public socketServer: Server = null;
  constructor(@InjectModel(LunchGroup.name) private lunchGroupModel: Model<LunchGroupDocument>) {}

  find(filter?: FilterQuery<LunchGroupDocument>, populate?: PopulateQuery) {
    return this.lunchGroupModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  findOne(filter?: FilterQuery<LunchGroupDocument>, populate?: PopulateQuery) {
    return this.lunchGroupModel.findOne(filter ?? {}).populate(populate ?? ('' as any));
  }

  create(grouppDto: CreateGroupDto, user: User, organization: Organization) {
    return this.lunchGroupModel.create({
      label: grouppDto.label,
      description: grouppDto.description,
      restaurant: grouppDto.restaurant,
      meetingTime: grouppDto.meetingTime,
      organization: organization._id,
      owner: user._id,
      userSlots: grouppDto.userSlots,
      users: [user._id],
    });
  }

  update(groupId: string, groupData: UpdatedGroupData) {
    return this.lunchGroupModel.findByIdAndUpdate(groupId, groupData, { new: true });
  }

  delete(groupId: string) {
    return this.lunchGroupModel.deleteOne({ _id: groupId }) as any;
  }

  async addUserToGroup(groupId: string, user: User) {
    const group = await this.lunchGroupModel.findById(groupId);
    if (group.userSlots && group.users.length >= group.userSlots) throw new Error('Group is full');
    group.users.push(user);
    return group.save();
  }

  async removeUserFromGroup(groupId: string, user: User) {
    const group = await this.lunchGroupModel.findById(groupId);
    group.users = group.users.filter(
      (participant) => participant._id.toString() !== user._id.toString(),
    );
    return group.save();
  }

  getUserLunchGroups(userId: string) {
    return this.lunchGroupModel.find({ $or: [{ users: { $in: [userId] } }, { owner: userId }] });
  }

  addUserToOrganization(organizationId: string, user: UserDto) {
    Logger.debug(
      `Emitting ${LunchGroupEmittedEvents.addUserToOrganization} to ${organizationId} - ${user.email}`,
    );

    Logger.debug(`Socket server: ${this.socketServer}`);
    return this.socketServer
      .to(organizationId)
      .emit(LunchGroupEmittedEvents.addUserToOrganization, { user });
  }
}
