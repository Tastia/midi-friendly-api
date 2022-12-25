import { OrganizationModule } from '@modules/organization/organization.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ChatMessage, ChatMessageSchema } from '@schemas/chatMessage.schema';
import { ChatRoom, ChatRoomSchema } from '@schemas/chatRoom.schema';
import { Global, Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatInterfaceService } from './chat-interface.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    forwardRef(() => AuthModule),
    OrganizationModule,
  ],
  providers: [ChatService, ChatInterfaceService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService, ChatInterfaceService],
})
export class ChatModule {}
