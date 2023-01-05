import { Organization } from '@schemas/oraganization.schema';
import { ChatGateway } from './chat.gateway';
import { ChatMessage, ChatMessageDocument } from '@schemas/chatMessage.schema';
import { PostMessageDto } from './dto/sub/post-message.dto';
import { User } from '@schemas/user.schema';
import { ChatRoom, ChatRoomDocument } from '@schemas/chatRoom.schema';
import { Inject, Injectable, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Server } from 'socket.io';
import { FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';
import { LunchGroupDocument } from '@schemas/lunchGroup.schema';
import { PaginateQuery } from '@shared/dto/paginate-query.dto';

@Injectable()
export class ChatService {
  public socketServer: Server = null;

  constructor(
    @InjectModel(ChatRoom.name) private readonly chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name) private readonly chatMessageModel: Model<ChatMessageDocument>,
    @Inject(forwardRef(() => ChatGateway)) private readonly chatGateway: ChatGateway,
  ) {}

  findUserRooms(user: User, organization: Organization, params: PaginateQuery) {
    Logger.debug('Resolving user rooms');
    return (this.chatRoomModel as any)
      .paginate(
        {
          organization: organization._id,
          users: user._id,
        },
        {
          offset: params.offset,
          limit: params.limit,
          populate: [
            { path: 'lunchGroup', select: '_id label' },
            { path: 'lunchGroupPoll', select: '_id label' },
          ],
          sort: { 'messages.createdAt': 1 },
        },
      )
      .then((result) => result.docs);
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

  async createMessage(user: User, messageData: PostMessageDto) {
    const message = await this.chatMessageModel.create({
      user: user._id,
      room: messageData.roomId,
      message: messageData.message,
    });

    return message.populate({ path: 'user', select: '_id firstName lastName avatar' });
  }
}
