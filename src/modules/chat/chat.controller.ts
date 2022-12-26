import { PaginateQuery } from '@shared/dto/paginate-query.dto';
import { ChatService } from './chat.service';
import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':roomId')
  getRoom(@Param('roomId') roomId: string) {
    return this.chatService.findOneRoom({ _id: roomId }, [
      { path: 'users', select: '_id firstName lastName avatar' },
    ]);
  }

  @Get(':roomId/messages')
  getPaginatedMessages(
    @Query(new ValidationPipe({ transform: true })) params: PaginateQuery,
    @Param('roomId') roomId: string,
  ) {
    return this.chatService.getPaginatedMessages(roomId, params);
  }
}
