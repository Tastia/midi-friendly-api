import { User } from './user.schema';
import { ChatMessage } from './chatMessage.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import mongoose, { Document } from 'mongoose';

export type ChatRoomDocument = ChatRoom & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class ChatRoom {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Schema.Types.ObjectId;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  users: User[];

  messages: ChatMessage[];
}

const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);

ChatRoomSchema.virtual('messages', {
  ref: 'ChatMessage',
  localField: '_id',
  foreignField: 'room',
});

export { ChatRoomSchema };
