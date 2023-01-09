import { ChatRoom } from '@schemas/chatRoom.schema';
import { ChatMessage } from '@schemas/chatMessage.schema';
import { PostMessageDto } from './dto/sub/post-message.dto';
import { ChatGatewayReceivedEvents, ChatGatewayEmittedEvents } from '@common/types/chat';
import { AuthService } from '@modules/auth/auth.service';
import { ChatService } from './chat.service';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { ActiveUser } from '@common/decorators/user.decorator';
import { User } from '@schemas/user.schema';
import { WsAuth } from '@common/decorators/ws-auth.decorator';
import { EventsMap } from 'node_modules/socket.io/dist/typed-events';
import { UserService } from '@modules/user/user.service';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { LunchGroupGateway } from '@modules/lunch-group/lunch-group.gateway';
import { Organization } from '@schemas/oraganization.schema';
import { LunchGroupEmittedEvents } from '@common/types/lunchGroup';
import { SetUserListDto } from '@modules/lunch-group/sub-dto/set-user-list.dto';
import { AsyncApiSub } from 'nestjs-asyncapi';

@WebSocketGateway(8080, { namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayConnection, OnGatewayInit {
  server: Server;
  public static userSockets: Map<string, Socket> = new Map<string, Socket>();

  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    @Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.chatService.socketServer = server;
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const { accessToken } = client.handshake.auth;
    const user = await this.authService.validateAccessToken(accessToken, false);
    if (!user) {
      return client.disconnect();
    }

    Logger.debug(`User ${user._id.toString()} connected to chat gateway`);
    ChatGateway.userSockets.set(user._id.toString(), client);

    const chatrooms = await this.chatService.findRoom({ users: user._id });
    for (const room of chatrooms) {
      Logger.debug(`User ${user._id.toString()} joined room ${room._id}`);
      client.join(room._id.toString());
    }

    const connectedUsers = await this.getConnectedUserSiblings(user);
    Logger.debug(`Connected users: ${connectedUsers.map((u) => u._id.toString())}`);

    this.emitSetUserList(
      client,
      connectedUsers as Array<Omit<User, 'organizations'> & { isOnline: boolean }>,
    );
    for (const chatUser of connectedUsers) {
      const userSocket = LunchGroupGateway.userSockets.get(chatUser._id.toString());
      if (userSocket) this.emitUserConnected(userSocket, chatUser._id.toString());
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const { accessToken } = client.handshake.auth;
    const user = await this.authService.validateAccessToken(accessToken, false);
    if (!user) {
      return client.disconnect();
    }

    Logger.debug(`User ${user._id.toString()} disconnected from chat gateway`);
    ChatGateway.userSockets.delete(user._id.toString());

    const chatrooms = await this.chatService.findRoom({ users: user._id });
    for (const room of chatrooms) client.leave(room._id);

    const connectedUsers = await this.getConnectedUserSiblings(user);
    for (const chatUser of connectedUsers) {
      const userSocket = LunchGroupGateway.userSockets.get(chatUser._id.toString());
      if (userSocket) this.emitUserDisconnected(userSocket, chatUser._id.toString());
    }
  }

  @WsAuth()
  @SubscribeMessage(ChatGatewayReceivedEvents.sendMessage)
  private async postMessage(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @MessageBody() data: PostMessageDto,
  ) {
    try {
      const room = await this.chatService.findOneRoom({ _id: data.roomId, user: user._id });
      if (!room) return { success: false, message: 'Canal de discussion non disponnible' };

      Logger.debug(`User ${user._id.toString()} sent a message to room ${room._id}`);

      const message = await this.chatService.createMessage(user, data);
      this.emitCreateMessage(client.broadcast.to(data.roomId), message);

      return {
        success: true,
        message: message,
      };
    } catch (err) {
      return { success: false, message: err.message || 'Une erreur est survenue' };
    }
  }

  @AsyncApiSub({
    channel: ChatGatewayEmittedEvents.setUserList,
    summary: 'Set user list',
    description: 'Set initial list of users connected to the organization when a user connects',
    message: {
      payload: {
        type: SetUserListDto,
      },
    },
  })
  private emitSetUserList(
    eventTarget: BroadcastOperator<EventsMap, any> | Socket,
    users: Array<Omit<User, 'organizations'> & { isOnline: boolean }>,
  ) {
    Logger.log(`Emitting set user list - ${users.length}`);
    return eventTarget.emit(ChatGatewayEmittedEvents.setUserList, { users });
  }

  private emitUserConnected(
    eventTarget: BroadcastOperator<EventsMap, any> | Socket,
    userId: string,
  ) {
    return eventTarget.emit(ChatGatewayEmittedEvents.userConnected, { userId });
  }

  private emitUserDisconnected(
    eventTarget: BroadcastOperator<EventsMap, any> | Socket,
    userId: string,
  ) {
    return eventTarget.emit(ChatGatewayEmittedEvents.userDisconnected, { userId });
  }

  private emitAddRoom(eventTarget: BroadcastOperator<EventsMap, any> | Socket, room: ChatRoom) {
    return eventTarget.emit(ChatGatewayEmittedEvents.addChatRoom, { room });
  }

  private emitCreateMessage(
    eventTarget: BroadcastOperator<EventsMap, any> | Socket,
    message: ChatMessage,
  ) {
    return eventTarget.emit(ChatGatewayEmittedEvents.addNewMessage, { message });
  }

  addUserToRoom(roomId: string, user: User) {
    const client = ChatGateway.userSockets.get(user._id.toString());
    if (client) client.join(roomId);
  }

  pushRoomToUser(user: User, room: ChatRoom) {
    const client = ChatGateway.userSockets.get(user._id.toString());
    if (client) this.emitAddRoom(client, room);
  }

  async getConnectedUserSiblings(user: User) {
    return (await this.userService.find({ organizations: { $in: user.organizations } }))
      .map((user) => user.toObject())
      .map((user) => ({
        ...user,
        credentials: {
          email: user.credentials.email,
          type: user.credentials.type,
        },
        isOnline: LunchGroupGateway.userSockets.has(user._id.toString()),
      }));
  }
}
