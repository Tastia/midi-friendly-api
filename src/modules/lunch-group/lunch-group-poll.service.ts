import { User } from '@schemas/user.schema';
import { Organization } from '@schemas/oraganization.schema';
import { CreateGroupPollDto } from './pub-dto/create-poll.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LunchGroupPoll, LunchGroupPollDocument } from '@schemas/lunchGroupPoll.schema';
import { Model } from 'mongoose';

@Injectable()
export class LunchGroupPollService {
  constructor(
    @InjectModel(LunchGroupPoll.name)
    private readonly lunchGroupPollModel: Model<LunchGroupPollDocument>,
  ) {}

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
      ...(pollData.allowedRestaurants && { allowedRestaurants: pollData.allowedRestaurants }),
    });
  }
}
