import { ChatRoom } from './chatRoom.schema';
import { User } from './user.schema';
import { valueToNode } from '@babel/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform } from 'class-transformer';
import mongoose, { Document } from 'mongoose';
import { Message } from '@common/types/chat';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mongoosePaginate = require('mongoose-paginate-v2');

export type ChatMessageDocument = Document & ChatMessage;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class ChatMessage {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' })
  room: ChatRoom;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: Message })
  message: Message;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }])
  readBy: User[];
}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.plugin(mongoosePaginate);

export { ChatMessageSchema };
