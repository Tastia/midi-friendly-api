import { LunchGroupGateway } from './lunch-group.gateway';
import { LunchGroupService } from '@modules/lunch-group/lunch-group.service';
import { User } from '@schemas/user.schema';
import { Organization } from '@schemas/oraganization.schema';
import { CreateGroupPollDto } from './pub-dto/create-poll.dto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LunchGroupPoll, LunchGroupPollDocument } from '@schemas/lunchGroupPoll.schema';
import { FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';
import { Server } from 'socket.io';
import { Cron } from '@nestjs/schedule';
import { LunchGroupEmittedEvents, LunchGroupStatus } from '@common/types/lunchGroup';
import { ChatGateway } from '@modules/chat/chat.gateway';

@Injectable()
export class LunchGroupPollService {
  public socketServer: Server = null;

  constructor(
    @InjectModel(LunchGroupPoll.name)
    private readonly lunchGroupPollModel: Model<LunchGroupPollDocument>,
    private readonly LunchGroupService: LunchGroupService,
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

  // RUN CRON EVERY MINUTE
  @Cron('1 * * * * *')
  async closeCompletedPolls() {
    const polls = await this.find({ voteDeadline: { $lte: new Date() } }).populate([
      'owner',
      'users',
      'organization',
      'votes.user',
      'chatRoom',
    ]);

    await this.lunchGroupPollModel.updateMany(
      { _id: { $in: polls.map((poll) => poll._id) } },
      { $set: { status: LunchGroupStatus.closed } },
    );

    Logger.log(`Closing ${polls.length} polls`);
    for (const poll of polls) {
      const mostVotedRestaurant = poll.votes
        .reduce((acc, vote) => {
          if (acc.some((restaurant) => restaurant.id === vote.restaurant))
            return acc.map((restaurant) =>
              restaurant.id === vote.restaurant
                ? { ...restaurant, votes: restaurant.votes + 1 }
                : restaurant,
            );
          else return [...acc, { id: vote.restaurant, votes: 1 }];
        }, [])
        .reduce((acc, restaurant) => (restaurant.votes > acc.votes ? restaurant : acc), {
          id: null,
          votes: 0,
        });

      const group = await this.LunchGroupService.create(
        {
          label: poll.label,
          description: poll.description,
          restaurant: mostVotedRestaurant.id,
          meetingTime: poll.meetingTime,
        },
        poll.owner,
        poll.organization,
        poll.votes.map((vote) => vote.user),
        poll.chatRoom,
      );

      for (const user of poll.votes.map((vote) => vote.user)) {
        ChatGateway.userSockets.get(user._id.toString())?.join(group.chatRoom.toString());
        LunchGroupGateway.userSockets.get(user._id.toString())?.join(group._id.toString());
      }

      this.socketServer
        ?.to(poll.organization._id.toString())
        .emit(LunchGroupEmittedEvents.closeGroupPoll, { pollId: poll._id });

      this.socketServer
        ?.to(poll.organization._id.toString())
        .emit(LunchGroupEmittedEvents.addGroup, { group });
    }
  }
}
