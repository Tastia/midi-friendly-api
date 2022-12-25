import { ChatGateway } from './chat.gateway';
import { ChatMessage, ChatMessageDocument } from '@schemas/chatMessage.schema';
import { User } from '@schemas/user.schema';
import { ChatRoom, ChatRoomDocument } from '@schemas/chatRoom.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Server } from 'socket.io';
import { Model } from 'mongoose';

@Injectable()
export class ChatInterfaceService {
  public socketServer: Server = null;

  constructor(
    @InjectModel(ChatRoom.name) private readonly chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name) private readonly chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  async addUserToRoom(user: User, roomId: string) {
    const room = await this.chatRoomModel.findById(roomId);
    if (!room) return null;

    room.users.push(user);
    await room.save();

    ChatGateway.userSockets.get(user._id.toString())?.join(roomId);
    return room;
  }

  async removeUserFromRoom(user: User, roomId: string) {
    const room = await this.chatRoomModel
      .findById(roomId)
      .populate({ path: 'users', select: '_id' });
    if (!room) return null;

    room.users = room.users.filter((u) => u._id.toString() !== user._id.toString());
    await room.save();

    ChatGateway.userSockets.get(user._id.toString())?.leave(roomId);
    return room;
  }
}
