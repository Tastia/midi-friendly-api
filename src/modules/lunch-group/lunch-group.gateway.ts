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
import { Server, Socket } from 'socket.io';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { DeleteGroupDto } from './dto/delete-group.dto';
import { WsAuth } from '@common/decorators/ws-auth.decorator';
import { Logger } from '@nestjs/common';

@WebSocketGateway(8080, { cors: { origin: '*' } })
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
      groups: await this.lunchGroupService.find({ organization: organization._id.toString() }),
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
  async createGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() createdGroup: CreateGroupDto,
  ) {
    const group = await (
      await this.lunchGroupService.create(createdGroup, user, organization)
    ).populate('users owner restaurant');
    this.RegisterLocalGroup(group._id.toString(), user._id.toString());
    this.AddUserToLocalGroup(user._id.toString(), group._id.toString());
    client.join(group._id.toString());
    this.server.to(organization._id.toString()).emit(LunchGroupEmittedEvents.addGroup, { group });
    client.emit(LunchGroupEmittedEvents.setGroupList, { group });
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.updateGroup)
  async updateGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    updatedGroupDto: UpdateGroupDto,
  ) {
    const udpatedGroup = await this.lunchGroupService.update(
      updatedGroupDto.groupId,
      updatedGroupDto.groupData,
    );
    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.updateGroup, { group: udpatedGroup });
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.deleteGroup)
  async deleteGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() { groupId }: DeleteGroupDto,
  ) {
    await this.lunchGroupService.delete(groupId);
    this.DeleteLocalGroup(groupId);
    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.removeGroup, { groupId });
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.joinGroup)
  async joinGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody() { groupId }: { groupId: string },
  ) {
    await this.lunchGroupService.addUserToGroup(groupId, user);
    this.AddUserToLocalGroup(user._id.toString(), groupId);
    client.join(groupId);
    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.addUserToGroup, { groupId, user });
  }

  @WsAuth()
  @SubscribeMessage(LunchGroupReceivedEvents.leaveGroup)
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
