export enum LunchGroupStatus {
  open = 'open',
  closed = 'closed',
}

export enum LunchGroupEmittedEvents {
  userConnected = 'UserConnected',
  userDisconnected = 'UserDisconnected',
  setUserList = 'SetUserList',
  setGroupList = 'SetGroupList',
  addGroup = 'AddGroup',
  removeGroup = 'RemoveGroup',
  updateGroup = 'UpdateGroup',
  addUserToGroup = 'AddUserToGroup',
  removeUserFromGroup = 'RemoveuserFrom group',
}

export enum LunchGroupReceivedEvents {
  createGroup = 'CreateGroup',
  deleteGroup = 'DeleteGroup',
  joinGroup = 'JoinGroup',
  leaveGroup = 'LeaveGroup',
  updateGroup = 'UpdateGroup',
}
