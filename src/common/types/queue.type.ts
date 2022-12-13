import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum Queues {
  MailQueue = 'Mail',
  MapsQueue = 'Maps',
}

export type QueuesPayload<T extends Queues> = T extends Queues.MailQueue
  ? QueueMailPayload
  : QueueMapsPayload;

export const defaultDelay = 600000;

export const SuccessJob = 'Completed' as const;
export const FailureJob = 'Failed' as const;

export enum QueueMapsOperation {
  GetOrganizationRestaurants = 'GetOrganizationRestaurants',
}

export enum QueueEmailsOperation {
  InviteUser = 'inviteUser',
  ConfirmOrganizationCreation = 'confirmOrganizationCreation',
}

export type _BaseQueuePayload<Operations> = {
  operation: Operations;
  operationId: string;
};

export type QueueMapsPayload<T = any> = _BaseQueuePayload<QueueMapsOperation> & {
  params: T extends QueueMapsOperation.GetOrganizationRestaurants
    ? { organizationId: string }
    : Record<string, unknown>;
};

export type QueueMailPayload<T = any> = _BaseQueuePayload<QueueEmailsOperation> & {
  params: T extends QueueEmailsOperation.InviteUser
    ? Array<{ email: string; invitationLink: string; expireAt: Date | string }>
    : Record<string, unknown>;
};

export class WorkerJobRecordParams {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' })
  organization?: string;
}

export enum QueueJobStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Success',
  Failed = 'Failed',
}
