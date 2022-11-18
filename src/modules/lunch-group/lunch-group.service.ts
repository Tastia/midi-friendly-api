import { UpdatedGroupData } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LunchGroup, LunchGroupDocument } from '@schemas/lunchGroup.schema';
import { User, UserDocument } from '@schemas/user.schema';
import { FilterQuery, Model } from 'mongoose';
import { Organization } from '@schemas/oraganization.schema';
import { PopulateQuery } from '@common/types/mongoose';

@Injectable()
export class LunchGroupService {
  constructor(@InjectModel(LunchGroup.name) private lunchGroupModel: Model<LunchGroupDocument>) {}

  find(filter?: FilterQuery<LunchGroupDocument>, populate?: PopulateQuery) {
    return this.lunchGroupModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  create(grouppDto: CreateGroupDto, user: User, organization: Organization) {
    return this.lunchGroupModel.create({
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
    group.users = group.users.filter((participant) => participant._id.toString() !== user._id.toString());
    return group.save();
  }

  getUserLunchGroups(userId: string) {
    return this.lunchGroupModel.find({ users: { $in: [userId] } }).populate('users restaurant owner');
  }
}
