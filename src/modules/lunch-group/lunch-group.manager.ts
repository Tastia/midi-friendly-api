import { Socket } from 'socket.io';
import { CreateGroupDto } from './dto/create-group.dto';
import { LunchGroup } from '@schemas/lunchGroup.schema';
import { LunchGroupService } from './lunch-group.service';
import { Injectable } from '@nestjs/common';
import { MapsGatewayUser } from '@common/types/gateway.type';
import { Organization } from '@schemas/oraganization.schema';
import { User } from '@schemas/user.schema';

@Injectable()
export class LunchGroupManager {
  lunchGroup: Map<string, LunchGroup> = new Map<string, LunchGroup>();
  users: Map<string, MapsGatewayUser> = new Map<string, MapsGatewayUser>();

  constructor(private readonly lunchGroupService: LunchGroupService) {}

  async setUserOnline(user: User, organization: Organization, socket: Socket) {
    this.users.set(user._id.toString(), { userData: user, organization, userSocket: socket });
  }

  async setUserOffline(user: User) {
    this.users.delete(user._id.toString());
  }

  async createLunchGroup(
    lunchGroup: CreateGroupDto,
    user: User,
    organization: Organization,
  ): Promise<LunchGroup> {
    const newLunchGroup = await (
      await this.lunchGroupService.create(lunchGroup, user, organization)
    ).populate('users restaurant owner');
    this.lunchGroup.set(newLunchGroup._id, newLunchGroup);

    return newLunchGroup;
  }

  async addUserToGroup(groupId: string, user: User): Promise<LunchGroup> {
    const group = await this.lunchGroupService.addUserToGroup(groupId, user);
    this.lunchGroup.set(groupId, { ...group, users: [...group.users, user] });
    return group;
  }

  async removeUserFromGroup(groupId: string, user: User): Promise<LunchGroup> {
    const group = await this.lunchGroupService.removeUserFromGroup(groupId, user);
    this.lunchGroup.set(groupId, {
      ...group,
      users: group.users.filter((u) => u._id !== user._id),
    });
    return group;
  }

  getAllUsersFromGroup(groupId: string): MapsGatewayUser[] {
    const group = this.lunchGroup.get(groupId);
    if (!group) return [];
    return group.users.map((user) => this.users.get(user._id.toString()));
  }

  getAllGroupsOfUser(userId: string): LunchGroup[] {
    return Array.from(this.lunchGroup.values()).filter((group) =>
      group.users.find((user) => user._id.toString() === userId),
    );
  }
}
