import { Message, MessageType } from '@common/types/chat';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested } from 'class-validator';
export class PostMessageDto {
  @ApiProperty()
  @IsString()
  roomId: string;

  @ApiProperty()
  @ValidateNested()
  message: Message;
}
