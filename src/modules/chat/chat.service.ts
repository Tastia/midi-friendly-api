import { Organization } from '@schemas/oraganization.schema';
import { ChatGateway } from './chat.gateway';
import { ChatMessage, ChatMessageDocument } from '@schemas/chatMessage.schema';
import { PostMessageDto } from './dto/sub/post-message.dto';
import { User } from '@schemas/user.schema';
import { ChatRoom, ChatRoomDocument } from '@schemas/chatRoom.schema';
import { Inject, Injectable, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Server } from 'socket.io';
import { AggregatePaginateModel, FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';
import { LunchGroupDocument } from '@schemas/lunchGroup.schema';
import { PaginateQuery } from '@shared/dto/paginate-query.dto';

@Injectable()
export class ChatService {
  public socketServer: Server = null;

  constructor(
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: AggregatePaginateModel<ChatRoomDocument>,
    @InjectModel(ChatMessage.name) private readonly chatMessageModel: Model<ChatMessageDocument>,
    @Inject(forwardRef(() => ChatGateway)) private readonly chatGateway: ChatGateway,
  ) {}

  findUserRooms(user: User, params: PaginateQuery) {
    Logger.debug('Resolving user rooms');

    const $aggregate = this.chatRoomModel.aggregate([
      {
        $match: { users: user._id },
      },
      {
        $lookup: {
          from: 'lunchgroups',
          localField: '_id',
          foreignField: 'chatRoom',
          as: 'lunchGroup',
          pipeline: [{ $project: { _id: 1, label: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'lunchgrouppolls',
          localField: '_id',
          foreignField: 'chatRoom',
          as: 'lunchGroupPoll',
          pipeline: [{ $project: { _id: 1, label: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'chatmessages',
          localField: '_id',
          foreignField: 'room',
          as: 'lastMessage',
          pipeline: [{ $sort: { _id: -1 } }, { $limit: 1 }],
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      {
        $set: {
          lunchGroup: { $arrayElemAt: ['$lunchGroup', 0] },
          lunchGroupPoll: { $arrayElemAt: ['$lunchGroupPoll', 0] },
          lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
        },
      },
    ]);
    return this.chatRoomModel
      .aggregatePaginate($aggregate, {
        offset: params.offset,
        limit: params.limit,
      })
      .then((result) => result.docs);
  }

  async markRoomMessagesAsRead(roomId: string, user: User) {
    const room = await this.chatRoomModel.findOne({ _id: roomId, users: user._id });
    if (!room) throw new Error('Room not found or user not in room');

    // GET MESSAGES THAT ARE NOT READ BY USER
    const messages = await this.chatMessageModel.find({ room: roomId, readBy: { $ne: user._id } });

    Logger.debug(`Marking ${messages.length} messages as read`);
    await Promise.all(
      messages.map(async (message) => {
        if (!message.readBy) message.readBy = [];
        message.readBy.push(user);
        message.markModified('readBy');
        await message.save();
      }),
    );

    return { success: true };
  }

  getPaginatedMessages(roomId: string, options: { offset: number; limit: number }) {
    return (this.chatMessageModel as any)
      .paginate(
        {
          room: roomId,
        },
        {
          offset: options.offset,
          limit: options.limit,
          populate: { path: 'user', select: '_id firstName lastName avatar' },
          sort: { _id: 1 },
        },
      )
      .then((result) => result.docs);
  }

  findRoom(filter?: FilterQuery<ChatRoomDocument>, populate?: PopulateQuery) {
    return this.chatRoomModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  findOneRoom(filter?: FilterQuery<LunchGroupDocument>, populate?: PopulateQuery) {
    return this.chatRoomModel.findOne(filter ?? {}).populate(populate ?? ('' as any));
  }

  createRoom(user: User) {
    return this.chatRoomModel.create({
      users: [user._id],
    });
  }

  async retriveRoomData(roomId: string) {
    const room = await this.chatRoomModel.findById(roomId).populate([
      { path: 'lunchGroup', select: '_id label' },
      { path: 'lunchGroupPoll', select: '_id label' },
      { path: 'messages', options: { sort: { _id: -1 }, limit: 1 }, justOne: true },
    ]);

    return { ...room.toObject(), lastMessage: room.messages[0] || null };
  }

  async createMessage(user: User, messageData: PostMessageDto) {
    const message = await this.chatMessageModel.create({
      user: user._id,
      room: messageData.roomId,
      message: messageData.message,
      readBy: [user._id],
    });

    return message.populate({
      path: 'user',
      select: '_id firstName lastName avatar',
    });
  }
}
