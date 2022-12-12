import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

class MapsController {
  public static async getRestaurants(organizationId: string): Promise<Restaurant[]> {
    return [];
  }
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
}

interface LunchGroup {
  _id: string;
  restaurant: string;
  owner: string;
  members: Array<string>;
  meetingTime: string;
  userSlots?: number;
}

interface Restaurant {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    country: string;
    zip: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export enum LunchGroupEmittedEvents {
  createGroup = 'CreateGroup',
  deleteGroup = 'DeleteGroup',
  joinGroup = 'JoinGroup',
  leaveGroup = 'LeaveGroup',
  updateGroup = 'UpdateGroup',
}

export enum LunchGroupReceivedEvents {
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

export const useMapsGateway = (user: { token: string; organizationID: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [lunchGroups, setLunchGroups] = useState<LunchGroup[]>([]);

  // IF YOU WANT TO HAVE RESTAURANTS HERE AS WELL, JUST FETCH THEM FROM THERE, WHEN HOOK IS MOUNTED
  // THIS WAY ALL CRITICAL STATE FOR THE MAP IS AVAILABLE AT A SINGLE PLACE
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  useEffect(() => {
    MapsController.getRestaurants(user.organizationID).then((restaurants) => setRestaurants(restaurants));
  }, []);

  const client = io('...', {
    transportOptions: {
      polling: {
        extraHeaders: {
          Authorization: `Bearer ${user.token}`,
          organizationId: user.organizationID,
        },
      },
    },
  });

  client.on(LunchGroupReceivedEvents.userConnected, (user: User) => setUsers((users) => [...users, user]));

  client.on(LunchGroupReceivedEvents.userDisconnected, (userId: string) =>
    setUsers((users) => users.filter((user) => user._id !== userId)),
  );

  client.on(LunchGroupReceivedEvents.setUserList, (users: User[]) => setUsers(users));

  client.on(LunchGroupReceivedEvents.setGroupList, (groups: LunchGroup[]) => setLunchGroups(groups));

  client.on(LunchGroupReceivedEvents.addGroup, (group: LunchGroup) => setLunchGroups((groups) => [...groups, group]));

  client.on(LunchGroupReceivedEvents.removeGroup, (groupId: string) =>
    setLunchGroups((groups) => groups.filter((group) => group._id !== groupId)),
  );

  client.on(LunchGroupReceivedEvents.updateGroup, (updatedGroup: LunchGroup) =>
    setLunchGroups((groups) => groups.map((group) => (group._id === updatedGroup._id ? updatedGroup : group))),
  );

  client.on(LunchGroupReceivedEvents.addUserToGroup, ({ groupId, userId }: { groupId: string; userId: string }) =>
    setLunchGroups((groups) =>
      groups.map((group) => (group._id === groupId ? { ...group, members: [...group.members, userId] } : group)),
    ),
  );

  client.on(LunchGroupReceivedEvents.removeUserFromGroup, ({ groupId, userId }: { groupId: string; userId: string }) =>
    setLunchGroups((groups) =>
      groups.map((group) =>
        group._id === groupId ? { ...group, members: group.members.filter((member) => member !== userId) } : group,
      ),
    ),
  );

  function CreateGroup(group: Omit<LunchGroup, '_id owner members'>) {
    return new Promise((resolve, reject) => {
      client.emit(LunchGroupEmittedEvents.createGroup, group, (response: any) => {
        // NO IDEA ON HOW TO TYPE A WS EVENT RESPONSE, WILL CHECK

        // HERE, CHECK FOR ERROR, & IF THERE IS ERROR THROW / RETURN ERROR TO THE CALLER
        // SO YOU CAN, FOR EXAMPLE, DISPLAY AN ERROR MESSAGE TO USER OR SOMETHING
        if (response.error) reject(response.error);
        else resolve(true);

        // I'M NOT ADDING THIS EXTRA VALIDATION DETAILS TO OTHER METHODS BUT YOU GET THE IDEA
      });
    });
  }

  function UpdateGroup(group: { groupId: string; groupData: Omit<LunchGroup, '_id owner members restaurant'> }) {
    client.emit(LunchGroupEmittedEvents.updateGroup, group);
  }

  function DeleteGroup(groupId: string) {
    client.emit(LunchGroupEmittedEvents.deleteGroup, { groupId });
  }

  function JoinGroup(groupId: string) {
    client.emit(LunchGroupEmittedEvents.joinGroup, { groupId });
  }

  function LeaveGroup(groupId: string) {
    client.emit(LunchGroupEmittedEvents.leaveGroup, { groupId });
  }

  return {
    users,
    lunchGroups,
    restaurants,
    CreateGroup,
    UpdateGroup,
    DeleteGroup,
    JoinGroup,
    LeaveGroup,
  };
};
