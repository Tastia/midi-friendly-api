# INFRA & APP SETUP

### 1. INSTALL & RUN API LOCALLY

**Pre-requisites:**
- Have [Redis](https://redis.io/download/) installed locally
- Have the dependencies installed (Prefer `npm`, since `yarn` & `pnpm` both have some unresolved issues with some of this app's dependencies).
- Have your `.env` set-up from the `.env.dist` (See with [@ChronicStone](https://github.com/ChronicStone) for DB access, & other ext. services keys)

**Run the dev server**

To start the dev server, run following steps :

1. Run the redis local server with `redis-server` *
2. On a new terminal, run the API main thread with `npm run start:dev`
3. Again on a new terminal, run the API worker with `npm run worker:start`

 
\* *You might need to reference in your OS env variables the path to redis-server binary to run it from any path*

> NOTE: You can run the API server only, but in that case anything that happens in queues (Restaurants resolving, emails, ...) won'



# REST SERVER SPECS

TODO...


# WEBSOCKET SERVER SPECS

## AUTHENTICATION

Authentication to the WebSocket server is handled through JWT, the same way the REST server handles it. This means two things : 
1. The user must be properly authenticated to connect to the WS server
2. The JWT token should be passed as an additional header to the Socket.IO client

Here's an example of setting up this extra authorization header : 

```ts
const socketOptions = {
   transportOptions: {
     polling: {
       extraHeaders: {
         Authorization: `Bearer ${JWT_TOKEN}`
         organization: CURRENT_ACTIVE_ORGANIZATION
       }
     }
   }
};

this.socket = io.connect(process.env.YOUR_SOCKET_ENDPOINT, socketOptions);
```

Right from the moment connexion is opened, the server will check for the tocken authenticity & reject the client if unable to authentify the token.

By receiving this token, the API will be able to know who's logged, but that won't be enough to retrive the accurate restaurants for him, consodering the fact that on the new architecture, an user can be part of multiple organizations. This means an additional "organization" header will be required, providing to API information about the current organization targetted by the user.

## EVENTS SPECIFICATION

The maps client will be able to publish/subscribe to a certain number to do all operations needed

### BASIC TS DEFINITIONS

```ts
interface User {
    _id: string
    firstName: string;
    lastName: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

interface Restaurant {
    name: string;
    coordinates: {
        longitude: string;
        latitude: string;
    }
    address: {
        street: string;
        city: string;
        country: string;
        zipCode: string;
    }
    createdAt: string;
    updatedAt: string;
}

interface LunchGroup {
    userSlots?: number;
    meetingTime: string;
    owner: User
    participants: Array<{
        user: User;
        isOwner: boolean;
        joinedAt: string;
    }>
    createdAt: string;
    updatedAt: string;
}
```

### 1. EVENTS RECEIVED FROM SERVER

```ts
export enum ServerEmittedEvents = {
    userConnected = "UserConnected",
    userDisconnected = "UserDisconnected",
    setUserList = "SetUserList"
    setGroupList = "SetGroupList",
    addGroup = "AddGroup",
    removeGroup = "RemoveGroup",
    updateGroup = "UpdateGroup",
    addUserToGroup = "AddUserToGroup",
    removeUserFromGroup = "RemoveuserFrom group"
}
```

You can see that events are splitted in many small events instead of having bigger ones handlings things with a more global approach (Ex : always use SetGroupList & push full updated list instead of having addGroup, removeGroup, updatedGroup separately). 

This is for performance & scalability matters. Having huge payloads being sent to multiple users each time a change occurs will quickly overload the server bandwith, so it is important to keep updates as light as possible.

As of now, events have been implemented with minimal payload, but those can be extended at will, depending on client needs.

#### A. UserConnected

Fired each time a user joins the map of an organization. Allows client to be aware of which users are online looking at the org. map, and display an activity indicator if needed.

```ts
interface UserConnectedEventPayload {
    user: User
}
```

#### B. UserDisconnected

When a user disconnects or change of org, notify the clients that user disconnected. Payload only contains user ID

```ts
interface UserDisconnectedEventPayload {
    userId: string;
}
```

#### C. SetUserList

This event is fired when a user in initially joins an org. map, to the user  who connected. It provides to the user the whole initlal list of connected users

```ts
interface SetUserListEventPayload {
    users: Array<User>
}
```

#### D. SetGroupList

Same as the previous one, request only sent when user initially joins an org. map. Provides the client with the initial list of registered & available groups 

```ts
interface SetGroupListEventPayload {
    groups: Array<LunchGroup>
    }>
}
```

#### E. AddGroup

Event dispatched each time a new group is created by someone, to users present on the targetted map.

```ts
interface AddGroupEventPayload {
    group: LunchGroup
}
```

#### E. RemoveGroup

Event fired each time a group is deleted / left by all participants (Which conducts to the expiracy of the group, it'll be considered as deleted)

```ts
interface RemoveGroupEventPayload {
    groupId: string;
}
```

#### E. UpdateGroup

Event fired if one of the key params of the group is updated by the owner (Meeting time, restriction on number of seats, ...)

```ts
interface UpdateGroupEventPayload {
    groupId: string;
    groupData: {
        userSlots?: number
        meetingTime?: string;
        owner?: User
    }
}
```

#### F. AddUserToGroup

Event fired when an user joined a group.

```ts
interface UpdateGroupEventPayload {
    user: User
}
```

#### F. RemoveUserFromGroup

Event fired each time an user leaves a group.

```ts
interface UpdateGroupEventPayload {
    userId: string;
}
```

### 1. EVENTS SENT TO SERVER

```ts
export enum ClientEmittedEvents = {
    createGroup = "CreateGroup",
    deleteGroup = "DeleteGroup",
    joinGroup = "JoinGroup",
    leaveGroup = "LeaveGroup",
    updateGroup = "UpdateGroup"
}
```

#### A. CreateGroup

Event emitted by client when user creates a new lunch group.

```ts
type CreateGroupEventPayload = Omit<LunchGroup, "owner participants createdAt updatedAt">
```

#### A. UpdateGroup

Event emitted by client when user creates a new lunch group.

```ts
type UpdateGroupEventPayload = Omit<LunchGroup, "owner participants createdAt updatedAt">
```

#### B. DeleteGroup

Event emitted by client when user deletes a lunch group he owns.

```ts
type DeleteGroupEventPayload = {
    groupId: string;
}
```

#### C. JoinGroup

Event emitted by client when user joins an existing group

```ts
type JoinGroupEventPayload = {
    groupId: string;
}
```

#### C. LeaveGroup

Event emitted by client when user joins an existing group

```ts
type LeaveGroupEventPayload = {
    groupId: string;
}
```
