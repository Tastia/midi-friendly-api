import { AddGroupDto } from './sub-dto/add-group.dto';
import { UserDisconnectedDto } from './sub-dto/user-disconnected.dt';
import { UserConnectedDto } from './sub-dto/user-connected.dto';
import { SetUserListDto } from './sub-dto/set-user-list.dto';
/* eslint-disable @typescript-eslint/no-empty-function */
import { OrganizationService } from './../organization/organization.service';
import { AuthService } from './../auth/auth.service';
import { UpdateGroupDto } from './pub-dto/update-group.dto';
import { UpdateGroupDto as SUpdateGroupDto } from './sub-dto/update-group.dto';
import { CreateGroupDto } from './pub-dto/create-group.dto';
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
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type { BroadcastOperator, Server, Socket } from 'socket.io';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { DeleteGroupDto } from './pub-dto/delete-group.dto';
import { WsAuth } from '@common/decorators/ws-auth.decorator';
import { Logger, UsePipes } from '@nestjs/common';
import { AsyncApiPub, AsyncApiService, AsyncApiSub } from 'nestjs-asyncapi';
import { AccessGroupDto } from './pub-dto/access-group-dto';
import { WSValidationPipe } from '@common/pipes/socket-validation.pipe';
import { EventsMap } from 'node_modules/socket.io/dist/typed-events';
import { LunchGroup } from '@schemas/lunchGroup.schema';
import { SetLunchGroupListDto } from './sub-dto/set-lunch-group-list.dto';
import { UserAccessGroupDto } from './sub-dto/user-access-group.dto';

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
@WebSocketGateway(8080, { cors: { origin: '*' } })
export class LunchGroupGateway implements OnGatewayConnection, OnGatewayConnection, OnGatewayInit {
  @WebSocketServer() server: Server;
  public static userSockets: Map<string, Socket> = new Map<string, Socket>();
  public static lunchGroupUsers = new Map<string, string[]>();

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly lunchGroupService: LunchGroupService,
    private readonly organizationService: OrganizationService,
  ) {}

  afterInit(server: Server) {
    this.lunchGroupService.socketServer = server;
  }

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

    const lunchGroups = await this.lunchGroupService.find({
      organization: organization._id,
      $and: [
        { createdAt: { $gte: new Date().setHours(0, 0, 0) } },
        { createdAt: { $lte: new Date().setHours(23, 59, 59) } },
      ],
    });

    const connectedUsers = (await this.userService.find({ organizations: organization._id }))
      .map((user) => user.toObject())
      .map((user) => ({
        ...user,
        credentials: {
          email: user.credentials.email,
          type: user.credentials.type,
        },
        isOnline: LunchGroupGateway.userSockets.has(user._id.toString()),
      }));

    for (const group of lunchGroups.filter(
      (group) =>
        group.users.some((userId) => userId.toString() === user._id.toString()) ||
        group.owner.toString() === user._id.toString(),
    )) {
      client.join(group._id.toString());
      this.AddUserToLocalGroup(user._id.toString(), group._id.toString());
    }

    this.emitUserConnected(client.broadcast.to(organization._id.toString()), user._id.toString());
    this.emitSetUserList(
      client,
      connectedUsers as Array<Omit<User, 'organizations'> & { isOnline: boolean }>,
    );
    this.emitSetGroupList(client, lunchGroups);
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

    this.emitUserDisconnected(
      client.broadcast.to(organization._id.toString()),
      user._id.toString(),
    );
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
    try {
      const group = await this.lunchGroupService.create(createdGroup, user, organization);
      this.RegisterLocalGroup(group._id.toString(), user._id.toString());
      this.AddUserToLocalGroup(user._id.toString(), group._id.toString());
      client.join(group._id.toString());

      this.emitAddGroup(this.server.to(organization._id.toString()), group);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
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
    @MessageBody() { groupData, groupId }: UpdateGroupDto,
  ) {
    try {
      const group = await this.lunchGroupService.findOne({
        _id: groupId,
        organization: organization._id,
      });

      if (!group) throw new WsException('Group not found');
      if (group.owner.toString() !== user._id.toString())
        throw new WsException('Unauthorized operation');

      const udpatedGroup = await this.lunchGroupService.update(groupId, groupData);
      this.emitUpdateGroup(this.server.to(organization._id.toString()), udpatedGroup);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
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
    try {
      const group = await this.lunchGroupService.findOne({
        _id: groupId,
        organization: organization._id,
      });

      if (!group) throw new WsException('Group not found');
      if (group.owner.toString() !== user._id.toString())
        throw new WsException('Unauthorized operation');

      await this.lunchGroupService.delete(groupId);
      this.DeleteLocalGroup(groupId);
      this.emitRemoveGroup(this.server.to(organization._id.toString()), { groupId });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
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
    try {
      client.join(groupId);
      await this.lunchGroupService.addUserToGroup(groupId, user);
      this.AddUserToLocalGroup(user._id.toString(), groupId);
      this.emitAddUserToGroup(this.server.to(organization._id.toString()), {
        groupId,
        userId: user._id.toString(),
      });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
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
    try {
      client.leave(groupId);
      await this.lunchGroupService.removeUserFromGroup(groupId, user);

      this.RemoveUserFromLocaleGroup(user._id.toString(), groupId);
      this.emitRemoveUserFromGroup(this.server.to(organization._id.toString()), {
        groupId,
        userId: user._id.toString(),
      });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ###############################################################################
  // ############################ EVENT EMITTERS ###################################
  // ###############################################################################

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.userConnected,
    summary: 'User connected',
    description: 'Notify clients that user of their org. connected',
    message: {
      payload: {
        type: UserConnectedDto,
      },
    },
  })
  emitUserConnected(eventTarget: BroadcastOperator<EventsMap, any> | Socket, userId: string) {
    Logger.log(`Emitting user connected - ${userId}`);
    return eventTarget.emit(LunchGroupEmittedEvents.userConnected, { userId });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.userDisconnected,
    summary: 'User disconnected',
    description: 'Notify clients that user of their org. disconnected',
    message: {
      payload: {
        type: UserDisconnectedDto,
      },
    },
  })
  emitUserDisconnected(eventTarget: BroadcastOperator<EventsMap, any> | Socket, userId: string) {
    Logger.log(`Emitting user disconnected - ${userId}`);
    return eventTarget.emit(LunchGroupEmittedEvents.userDisconnected, { userId });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.setUserList,
    summary: 'Set user list',
    description: 'Set initial list of users connected to the organization when a user connects',
    message: {
      payload: {
        type: SetUserListDto,
      },
    },
  })
  emitSetUserList(
    eventTarget: BroadcastOperator<EventsMap, any> | Socket,
    users: Array<Omit<User, 'organizations'> & { isOnline: boolean }>,
  ) {
    Logger.log(`Emitting set user list - ${users.length}`);
    return eventTarget.emit(LunchGroupEmittedEvents.setUserList, { users });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.setGroupList,
    summary: 'Set group list',
    description: 'Set initial list of groups of the organization when a user connects',
    message: {
      payload: {
        type: SetLunchGroupListDto,
      },
    },
  })
  emitSetGroupList(eventTarget: BroadcastOperator<EventsMap, any> | Socket, groups: LunchGroup[]) {
    Logger.log(`Emitting set group list - ${groups.length}`);
    return eventTarget.emit(LunchGroupEmittedEvents.setGroupList, { groups });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.addGroup,
    summary: 'Add group',
    description: 'Notify clients that a group was added to the organization',
    message: {
      payload: {
        type: AddGroupDto,
      },
    },
  })
  emitAddGroup(eventTarget: BroadcastOperator<EventsMap, any> | Socket, group: LunchGroup) {
    Logger.log(`Emitting add group - ${group._id}`);
    return eventTarget.emit(LunchGroupEmittedEvents.addGroup, { group });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.updateGroup,
    summary: 'Update group',
    description: 'Notify clients that a group was updated',
    message: {
      payload: {
        type: SUpdateGroupDto,
      },
    },
  })
  emitUpdateGroup(eventTarget: BroadcastOperator<EventsMap, any> | Socket, group: LunchGroup) {
    Logger.log(`Emitting update group - ${group._id}`);
    return eventTarget.emit(LunchGroupEmittedEvents.updateGroup, {
      groupData: group,
      groupId: group._id.toString(),
    });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.removeGroup,
    summary: 'Remove group',
    description: 'Notify clients that a group was removed from the organization',
    message: {
      payload: {
        type: DeleteGroupDto,
      },
    },
  })
  emitRemoveGroup(eventTarget: BroadcastOperator<EventsMap, any> | Socket, data: DeleteGroupDto) {
    Logger.log(`Emitting remove group - ${data.groupId}`);
    return eventTarget.emit(LunchGroupEmittedEvents.removeGroup, data);
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.addUserToGroup,
    summary: 'Add user to group',
    description: 'Notify clients that a user was added to a group',
    message: {
      payload: {
        type: UserAccessGroupDto,
      },
    },
  })
  emitAddUserToGroup(
    eventTarget: BroadcastOperator<EventsMap, any> | Socket,
    { groupId, userId }: UserAccessGroupDto,
  ) {
    Logger.log(`Emitting add user to group - ${groupId} - ${userId}`);
    return eventTarget.emit(LunchGroupEmittedEvents.addUserToGroup, { groupId, userId });
  }

  @AsyncApiSub({
    channel: LunchGroupEmittedEvents.removeUserFromGroup,
    summary: 'Add user to group',
    description: 'Notify clients that a user was added to a group',
    message: {
      payload: {
        type: UserAccessGroupDto,
      },
    },
  })
  emitRemoveUserFromGroup(
    eventTarget: BroadcastOperator<EventsMap, any> | Socket,
    data: UserAccessGroupDto,
  ) {
    Logger.log(`Emitting remove user from group - ${data.groupId} - ${data.userId}`);
    return eventTarget.emit(LunchGroupEmittedEvents.removeUserFromGroup, data);
  }

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
