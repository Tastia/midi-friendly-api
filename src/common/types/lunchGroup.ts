import { Restaurant } from '@schemas/restaurant.schema';
import { User } from '@schemas/user.schema';
import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum LunchGroupStatus {
  open = 'Open',
  closed = 'Closed',
  cancelled = 'Cancelled',
}

export enum LunchGroupEmittedEvents {
  addUserToOrganization = 'AddUserToOrganization',
  userConnected = 'UserConnected',
  userDisconnected = 'UserDisconnected',
  setUserList = 'SetUserList',
  setGroupList = 'SetGroupList',
  setGroupPollList = 'SetGroupPollList',
  addGroup = 'AddGroup',
  removeGroup = 'RemoveGroup',
  updateGroup = 'UpdateGroup',
  addUserToGroup = 'AddUserToGroup',
  removeUserFromGroup = 'RemoveUserFromGroup',
  addGroupPoll = 'AddGroupPoll',
  removeGroupPoll = 'RemoveGroupPoll',
  updateGroupPoll = 'UpdateGroupPoll',
  addGroupPollEntry = 'AddGroupPollEntry',
  closeGroupPoll = 'CloseGroupPoll',
}

export enum LunchGroupReceivedEvents {
  createGroup = 'CreateGroup',
  deleteGroup = 'DeleteGroup',
  joinGroup = 'JoinGroup',
  leaveGroup = 'LeaveGroup',
  updateGroup = 'UpdateGroup',
  createGroupPoll = 'CreateGroupPoll',
  deleteGroupPoll = 'DeleteGroupPoll',
  voteGroupPoll = 'VoteGroupPoll',
}

@Schema({ timestamps: true })
export class LunchGroupPollEntries {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' })
  restaurant: Restaurant;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;
}
