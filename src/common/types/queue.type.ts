import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum Queues {
  MailQueue = 'Mail',
  MapsQueue = 'Maps',
}

export const defaultDelay = 600000;

export const SuccessJob = 'Completed' as const;
export const FailureJob = 'Failed' as const;

export enum QueueMapsOperation {
  GetOrganizationRestaurants = 'GetOrganizationRestaurants',
}

export type _BaseQueuePayload = {
  operation: QueueMapsOperation;
  operationId: string;
};

export type QueueMapsPayload<T = any> = _BaseQueuePayload & {
  params: T extends QueueMapsOperation.GetOrganizationRestaurants
    ? { organizationId: string }
    : Record<string, unknown>;
};

export type QueueMailPayload = {
  operation: 'inviteUser' | 'confirmOrganizationCreation';
  emailParams: Record<string, unknown>;
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
