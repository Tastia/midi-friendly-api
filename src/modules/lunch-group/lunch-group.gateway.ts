import { Logger, UseGuards, ValidationPipe } from '@nestjs/common';
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
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ActiveOrganization } from '@common/decorators/organization.decorator';
import { DeleteGroupDto } from './dto/delete-group.dto';
import { AsyncApiService, AsyncApiPub } from 'nestjs-asyncapi';
import { AccessGroupDto } from './dto/access-group.dto';
import { GatewayGuard } from '@common/guards/gateway.guard';

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

// @AsyncApiService({
//   serviceName: 'LunchGroupGateway',
//   description: 'Lunch group gateway - Manages all live interactions with the users map ',
// })
@WebSocketGateway(8080, { cors: { origin: '*' } })
export class LunchGroupGateway implements OnGatewayConnection, OnGatewayConnection {
  @WebSocketServer() server: Server;
  public static userSockets: Map<string, Socket> = new Map<string, Socket>();
  public static lunchGroupUsers = new Map<string, string[]>();

  constructor(
    private readonly userService: UserService,
    private readonly lunchGroupService: LunchGroupService,
  ) {}

  @UseGuards(GatewayGuard)
  async handleConnection(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
  ) {
    Logger.log(`User connected to LunchGroupGateway`);
    const allRequestHeaders = client.handshake.headers;

    Logger.log(JSON.stringify(allRequestHeaders, null, 2));
    // 1. REGISTER USER DATA/SOCKET
    // 2. NOTIFY ORGANIZATION USERS OF NEW USER ONLINE [PUB: userOnline]
  }

  async handleDisconnect(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
  ) {
    // 1. UNREGISTER USER DATA/SOCKET
    // 2. NOTIFY ORGANIZATION USERS OF USER OFFLINE [PUB: userOffline]
  }

  @SubscribeMessage(LunchGroupReceivedEvents.createGroup)
  // @AsyncApiPub({
  //   channel: LunchGroupReceivedEvents.createGroup,
  //   summary: 'Create lunch group',
  //   description:
  //     'Creates a new lunch group on the DB, and send it to all users of same organization',
  //   message: {
  //     payload: { type: CreateGroupDto },
  //     headers: AUTH_HEADERS_DOC as any,
  //   },
  // })
  async createGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    createdGroup: CreateGroupDto,
  ) {
    // 1. CREATE GROUP IN DB / CACHE
    // 2. NOTIFY ORGANIZATION USERS OF NEW GROUP [PUB: groupCreated]
  }

  @SubscribeMessage(LunchGroupReceivedEvents.updateGroup)
  // @AsyncApiPub({
  //   channel: LunchGroupReceivedEvents.updateGroup,
  //   summary: 'Update lunch group',
  //   description:
  //     'Updates an existing lunch group on the DB, and update it for all users of same organization',
  //   message: {
  //     payload: { type: UpdateGroupDto },
  //     headers: AUTH_HEADERS_DOC as any,
  //   },
  // })
  async updateGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    updatedGroupDto: UpdateGroupDto,
  ) {
    // 1. UPDATE GROUP IN DB / CACHE
    // 2. NOTIFY ORGANIZATION USERS OF UPDATED GROUP [PUB: groupUpdated]
  }

  @SubscribeMessage(LunchGroupReceivedEvents.deleteGroup)
  // @AsyncApiPub({
  //   channel: LunchGroupReceivedEvents.deleteGroup,
  //   summary: 'Delete lunch group',
  //   description:
  //     'Delete an existing lunch group on the DB, and remove it it for all users of same organization',
  //   message: {
  //     payload: { type: DeleteGroupDto },
  //     headers: AUTH_HEADERS_DOC as any,
  //   },
  // })
  async deleteGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody(new ValidationPipe({ transform: true })) { groupId }: DeleteGroupDto,
  ) {
    // 1. DELETE GROUP IN DB / CACHE
    // 2. NOTIFY ORGANIZATION USERS OF DELETED GROUP [PUB: groupDeleted]
  }

  @SubscribeMessage(LunchGroupReceivedEvents.joinGroup)
  // @AsyncApiPub({
  //   channel: LunchGroupReceivedEvents.joinGroup,
  //   summary: 'Join lunch group',
  //   description: 'Join an existing lunch group on the DB, notify all users of same organization',
  //   message: {
  //     payload: { type: AccessGroupDto },
  //     headers: AUTH_HEADERS_DOC as any,
  //   },
  // })
  async joinGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody(new ValidationPipe({ transform: true })) { groupId }: AccessGroupDto,
  ) {
    await this.lunchGroupService.addUserToGroup(groupId, user);
    this.AddUserToLocalGroup(user._id.toString(), groupId);
    client.join(groupId);
    this.server
      .to(organization._id.toString())
      .emit(LunchGroupEmittedEvents.addUserToGroup, { groupId, user });
  }

  @SubscribeMessage(LunchGroupReceivedEvents.leaveGroup)
  // @AsyncApiPub({
  //   channel: LunchGroupReceivedEvents.joinGroup,
  //   summary: 'Leave lunch group',
  //   description: 'Leave an existing lunch group on the DB, notify all users of same organization',
  //   message: {
  //     payload: { type: AccessGroupDto },
  //     headers: AUTH_HEADERS_DOC as any,
  //   },
  // })
  async leaveGroup(
    @ConnectedSocket() client: Socket,
    @ActiveUser() user: User,
    @ActiveOrganization() organization: Organization,
    @MessageBody(new ValidationPipe({ transform: true })) { groupId }: { groupId: string },
  ) {
    // 1. REMOVE USER FROM GROUP IN DB / CACHE
    // 2. NOTIFY ORGANIZATION USERS OF USER LEFT GROUP [PUB: userLeftGroup]
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
