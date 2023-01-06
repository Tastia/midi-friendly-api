import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum MessageType {
  text = 'text',
  image = 'image',
  audio = 'audio',
  video = 'video',
}

export class Message {
  @Prop({ enum: MessageType })
  @ApiProperty()
  @IsEnum(MessageType)
  type: MessageType;

  @Prop()
  @ApiProperty()
  @IsString()
  content: string;
}

export enum ChatGatewayEmittedEvents {
  addChatRoom = 'addChatRoom',
  addNewMessage = 'addNewMessage',
  setUserList = 'setUserList',
  userConnected = 'userConnected',
  userDisconnected = 'userDisconnected',
}

export enum ChatGatewayReceivedEvents {
  sendMessage = 'SendMessage',
}
