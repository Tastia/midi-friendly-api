/* eslint-disable @typescript-eslint/no-empty-function */
import { OrganizationService } from './../organization/organization.service';
import { AuthService } from './../auth/auth.service';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { LunchGroupEmittedEvents } from '@common/types/lunchGroup';
import { LunchGroupService } from './lunch-group.service';
import { UserService } from '@modules/user/user.service';
import { Organization } from '@schemas/oraganization.schema';
import { User } from '@schemas/user.schema';
import { ActiveUser } from '@common/decorators/user.decorator';
import { LunchGroupReceivedEvents } from '@common/types/lunchGroup';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type { BroadcastOperator, Server, Socket } from 'socket.io';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { DeleteGroupDto } from './dto/delete-group.dto';
import { WsAuth } from '@common/decorators/ws-auth.decorator';
import { Logger, UsePipes } from '@nestjs/common';
import { AsyncApiPub, AsyncApiService, AsyncApiSub } from 'nestjs-asyncapi';
import { AccessGroupDto } from './dto/access-group-dto';
import { WSValidationPipe } from '@common/pipes/socket-validation.pipe';
import { EventsMap } from 'node_modules/socket.io/dist/typed-events';

const GATEWAY_CHANNEL = 'LunchGroupGateway';
const AUTH_HEADERS_DOC = {
  type: 'object',
  properties: {
    Authorization: {
      description: 'JWT token',
      type: 'string',
      example: '',
    },
    organizationId: {
      description: 'Organization ID',
      type: 'string',
      example: '',
    },
  },
};

@AsyncApiService({
  serviceName: 'LunchGroupGateway',
  description: 'Lunch group gateway - Manages all live interactions with the users map ',
})
@WebSocketGateway({ cors: { origin: '*' } })
export class LunchGroupGateway implements OnGatewayConnection, OnGatewayConnection {
  @WebSocketServer() server: Server;
  public static userSockets: Map<string, Socket> = new Map<string, Socket>();
  public static lunchGroupUsers = new Map<string, string[]>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly lunchGroupService: LunchGroupService,
    private readonly organizationService: OrganizationService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const { authorization, organizationid } = client.handshake.headers;
    const user = await this.authService.validateAccessToken(authorization.split(' ')[1]);
    const organization = await this.organizationService.findOne({ _id: organizationid });
    if (!user || !organization) {
      client.disconnect();
      throw new WsException('Unauthorized');
    }

    Logger.debug(
      `User ${user._id.toString()} connected to organization ${organization._id.toString()}`,
    );

    LunchGroupGateway.userSockets.set(user._id.toString(), client);

    client.join(organization._id.toString());
    const lunchGroups = await (
      await this.lunchGroupService.getUserLunchGroups(user._id.toString())
    ).filter((group) => group.organization._id.toString() === organization._id.toString());

    lunchGroups.forEach((group) => {
      client.join(group._id.toString());
      this.AddUserToLocalGroup(user._id.toString(), group._id.toString());
    });

    client.broadcast
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.userConnected, { user });
    client.emit(LunchGroupEmittedEvents.setUserList, {
      users: await this.GetOnlineOrganizationUsers(organization._id.toString()),
    });
    client.emit(LunchGroupEmittedEvents.setGroupList, {
      groups: await this.lunchGroupService.find({ organization: organization._id.toString() }, [
        { path: 'users', select: 'firstName lastName _id' },
        { path: 'owner', select: 'firstName lastName _id' },
      ]),
    });
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const { authorization, organizationid } = client.handshake.headers;
    const user = await this.authService.validateAccessToken(authorization.split(' ')[1]);
    const organization = await this.organizationService.findOne({ _id: organizationid });

    LunchGroupGateway.userSockets.delete(user._id.toString());

    const userGroups = this.GetUserGroups(user._id.toString());
    userGroups.forEach((groupId) => {
      this.RemoveUserFromLocaleGroup(user._id.toString(), groupId);
      client.leave(groupId);
    });

    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.userDisconnected, { userId: user._id.toString() });
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.createGroup)
  @UsePipes(new WSValidationPipe({ transform: true }))
  @AsyncApiPub({
    channel: LunchGroupReceivedEvents.createGroup,
    summary: 'Create lunch group',
    description:
      'Creates a new lunch group on the DB, and send it to all users of same organization',
    message: {
      payload: { type: CreateGroupDto },
      headers: AUTH_HEADERS_DOC as any,
    },
  })
  async createGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() createdGroup: CreateGroupDto,
  ) {
    const group = await (
      await this.lunchGroupService.create(createdGroup, user, organization)
    ).populate('users owner');
    this.RegisterLocalGroup(group._id.toString(), user._id.toString());
    this.AddUserToLocalGroup(user._id.toString(), group._id.toString());
    client.join(group._id.toString());
    this.server.to(organization._id.toString()).emit(LunchGroupEmittedEvents.addGroup, { group });
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.updateGroup)
  @UsePipes(new WSValidationPipe({ transform: true }))
  @AsyncApiPub({
    channel: LunchGroupReceivedEvents.updateGroup,
    summary: 'Update lunch group',
    description:
      'Updates an existing lunch group on the DB, and update it for all users of same organization',
    message: {
      payload: { type: UpdateGroupDto },
      headers: AUTH_HEADERS_DOC as any,
    },
  })
  async updateGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() updatedGroupDto: UpdateGroupDto,
  ) {
    const udpatedGroup = await this.lunchGroupService.update(
      updatedGroupDto.groupId,
      updatedGroupDto.groupData,
    );
    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.updateGroup, udpatedGroup);
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.deleteGroup)
  @UsePipes(new WSValidationPipe({ transform: true }))
  @AsyncApiPub({
    channel: LunchGroupReceivedEvents.deleteGroup,
    summary: 'Delete lunch group',
    description:
      'Delete an existing lunch group on the DB, and remove it it for all users of same organization',
    message: {
      payload: { type: DeleteGroupDto },
      headers: AUTH_HEADERS_DOC as any,
    },
  })
  async deleteGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() { groupId }: DeleteGroupDto,
  ) {
    await this.lunchGroupService.delete(groupId);
    this.DeleteLocalGroup(groupId);
    this.server.to(organization._id.toString()).emit(LunchGroupEmittedEvents.removeGroup, groupId);
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.joinGroup)
  @UsePipes(new WSValidationPipe({ transform: true }))
  @AsyncApiPub({
    channel: LunchGroupReceivedEvents.joinGroup,
    summary: 'Join lunch group',
    description: 'Join an existing lunch group on the DB, notify all users of same organization',
    message: {
      payload: { type: AccessGroupDto },
      headers: AUTH_HEADERS_DOC as any,
    },
  })
  async joinGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() { groupId }: AccessGroupDto,
  ) {
    await this.lunchGroupService.addUserToGroup(groupId, user);
    this.AddUserToLocalGroup(user._id.toString(), groupId);
    client.join(groupId);
    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.addUserToGroup, { groupId, userId: user._id.toString() });
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.leaveGroup)
  @UsePipes(new WSValidationPipe({ transform: true }))
  @AsyncApiPub({
    channel: LunchGroupReceivedEvents.leaveGroup,
    summary: 'Leave lunch group',
    description: 'Leave an existing lunch group on the DB, notify all users of same organization',
    message: {
      payload: { type: AccessGroupDto },
      headers: AUTH_HEADERS_DOC as any,
    },
  })
  async leaveGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() { groupId }: { groupId: string },
  ) {
    await this.lunchGroupService.removeUserFromGroup(groupId, user);
    this.RemoveUserFromLocaleGroup(user._id.toString(), groupId);
    client.leave(groupId);
    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.updateGroup, { groupId, userId: user._id.toString() });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.userConnected,
    summary: 'User connected',
    description: 'Notify clients that user of their org. connected',
    message: {
      payload: {
        type: User,
      },
    },
  })
  emitUserConnected(eventTarget: BroadcastOperator<EventsMap, any>) {
    return eventTarget.emit(LunchGroupEmittedEvents.userConnected, {});
  }

  emitUserDisconnected() {}

  emitSetUserList() {}

  emitSetGroupList() {}

  emitAddGroup() {}

  emitUpdateGroup() {}

  emitRemoveGroup() {}

  emitAddUserToGroup() {}

  emitRemoveUserFromGroup() {}

  private RegisterLocalGroup(groupId: string, owner: string) {
    LunchGroupGateway.lunchGroupUsers.set(groupId, [owner]);
  }

  private DeleteLocalGroup(groupId: string) {
    LunchGroupGateway.lunchGroupUsers.delete(groupId);
  }

  private AddUserToLocalGroup(userId: string, groupId: string) {
    const users = LunchGroupGateway.lunchGroupUsers.get(groupId);
    if (users) {
      users.push(userId);
    } else {
      LunchGroupGateway.lunchGroupUsers.set(groupId, [userId]);
    }
  }

  private RemoveUserFromLocaleGroup(userId: string, groupId: string) {
    const users = LunchGroupGateway.lunchGroupUsers.get(groupId);
    if (users)
      LunchGroupGateway.lunchGroupUsers.set(
        groupId,
        users.filter((id) => id !== userId),
      );
  }

  private GetUserGroups(userId: string) {
    return Array.from(LunchGroupGateway.lunchGroupUsers.entries())
      .filter(([, users]) => users.includes(userId))
      .map(([groupId]) => groupId);
  }

  private GetUserSocket(userId: string) {
    return LunchGroupGateway.userSockets.get(userId);
  }

  private async GetOnlineOrganizationUsers(organizationId: string) {
    const userIds = Array.from(LunchGroupGateway.userSockets.entries()).map(([userId]) => userId);
    return this.userService.find({
      _id: { $in: userIds },
      organizations: { $in: [organizationId] },
    });
  }
}
