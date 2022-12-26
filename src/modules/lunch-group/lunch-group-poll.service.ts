import { User } from '@schemas/user.schema';
import { Organization } from '@schemas/oraganization.schema';
import { CreateGroupPollDto } from './pub-dto/create-poll.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LunchGroupPoll, LunchGroupPollDocument } from '@schemas/lunchGroupPoll.schema';
import { FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';

@Injectable()
export class LunchGroupPollService {
  constructor(
    @InjectModel(LunchGroupPoll.name)
    private readonly lunchGroupPollModel: Model<LunchGroupPollDocument>,
  ) {}

  find(filter?: FilterQuery<LunchGroupPollDocument>, populate?: PopulateQuery) {
    return this.lunchGroupPollModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  findOne(filter?: FilterQuery<LunchGroupPollDocument>, populate?: PopulateQuery) {
    return this.lunchGroupPollModel.findOne(filter ?? {}).populate(populate ?? ('' as any));
  }

  async createPoll(pollData: CreateGroupPollDto, organization: Organization, user: User) {
    return this.lunchGroupPollModel.create({
      label: pollData.label,
      description: pollData.description,
      restaurant: pollData.restaurant,
      meetingTime: pollData.meetingTime,
      userSlots: pollData.userSlots,
      organization: organization._id,
      owner: user._id,
      voteDeadline: pollData.voteDeadline,
      votes: [],
      ...(pollData.allowedRestaurants && { allowedRestaurants: pollData.allowedRestaurants }),
    });
  }
}
