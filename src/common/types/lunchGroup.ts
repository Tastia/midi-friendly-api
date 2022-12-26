import { Restaurant } from '@schemas/restaurant.schema';
import { User } from '@schemas/user.schema';
import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum LunchGroupStatus {
  open = 'Open',
  closed = 'Closed',
  cancelled = 'Deleted',
}

export enum LunchGroupEmittedEvents {
  addUserToOrganization = 'AddUserToOrganization',
  userConnected = 'UserConnected',
  userDisconnected = 'UserDisconnected',
  setUserList = 'SetUserList',
  setGroupList = 'SetGroupList',
  addGroup = 'AddGroup',
  removeGroup = 'RemoveGroup',
  updateGroup = 'UpdateGroup',
  addUserToGroup = 'AddUserToGroup',
  removeUserFromGroup = 'RemoveUserFromGroup',
}

export enum LunchGroupReceivedEvents {
  createGroup = 'CreateGroup',
  deleteGroup = 'DeleteGroup',
  joinGroup = 'JoinGroup',
  leaveGroup = 'LeaveGroup',
  updateGroup = 'UpdateGroup',
}

export class LunchGroupPollEntries {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' })
  restaurant: Restaurant;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;
}
