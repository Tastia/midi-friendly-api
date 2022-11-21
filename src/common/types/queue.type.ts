export enum Queues {
  MailQueue = 'Mail',
  MapsQueue = 'Maps',
}

export const defaultDelay = 600000;

export const SuccessJob = 'Done';
export const FailureJob = 'Failed';

export type QueueMapsPayload = {
  operation: 'getRestaurants';
  organizationId: string;
};

export type QueueMailPayload = {
  operation: 'inviteUser' | 'confirmOrganizationCreation';
  emailParams: Record<string, unknown>;
};
