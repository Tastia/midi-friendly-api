import { RequesterApp, CurrentApp } from './../../common/decorators/app.decorator';
import { User } from '@schemas/user.schema';
import { Organization } from '@schemas/oraganization.schema';
import { PaginateQuery } from '@shared/dto/paginate-query.dto';
import { ChatService } from './chat.service';
import {
  Controller,
  Get,
  Param,
  Query,
  ValidationPipe,
  BadRequestException,
  Post,
  Logger,
} from '@nestjs/common';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { ActiveUser } from '@common/decorators/user.decorator';
import { JWTAuth } from '@common/decorators/jwt-auth.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @JWTAuth()
  @Get(':roomId')
  getRoom(@Param('roomId') roomId: string) {
    return this.chatService.retriveRoomData(roomId);
  }

  @JWTAuth()
  @Get(':roomId/messages')
  getPaginatedMessages(
    @Query(new ValidationPipe({ transform: true })) params: PaginateQuery,
    @Param('roomId') roomId: string,
  ) {
    return this.chatService.getPaginatedMessages(roomId, params);
  }

  @JWTAuth()
  @Get()
  getUserRooms(
    @ActiveUser() user: User,
    @CurrentApp() app: RequesterApp,
    @Query(new ValidationPipe({ transform: true })) params: PaginateQuery,
  ) {
    Logger.debug(`getUserRooms: ${app}, ${!!user}`);
    if (!user || app !== 'client')
      throw new BadRequestException(`Accès non autorisé, ${app}, ${!!user}`);
    return this.chatService.findUserRooms(user, params);
  }

  @JWTAuth()
  @Post('mark-room-as-read/:roomId')
  markRoomMessagesAsRead(@Param('roomId') roomId: string, @ActiveUser() user: User) {
    if (!user) throw new BadRequestException('Accès non autorisé');
    return this.chatService.markRoomMessagesAsRead(roomId, user);
  }
}
