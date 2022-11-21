import { User, UserDocument } from '@schemas/user.schema';
import { QueueMailPayload, SuccessJob } from '@common/types/queue.type';
import { Queues } from '@common/types/queue.type';
import {
  OnGlobalQueuePaused,
  OnGlobalQueueResumed,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor(Queues.MailQueue)
export class MailerConsumer {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  @Process()
  async transcode(job: Job<QueueMailPayload>) {
    Logger.debug(JSON.stringify(job.data), 'MailQueue Consumer');

    return SuccessJob;
  }

  @OnQueueActive()
  onActive(job: Job) {
    Logger.debug(
      `Processing job ${job.id} of type MapsConsumer. Data: ${JSON.stringify(job.data)}`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    Logger.debug(`Completed job ${job.id} of type MapsConsumer. Result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    Logger.error(`Failed job ${job.id} of type MapsConsumer: ${error.message}`, error.stack);
  }

  @OnGlobalQueuePaused()
  onGlobalPaused() {
    Logger.debug('Queue paused (global) [MapsConsumer]');
  }

  @OnGlobalQueueResumed()
  onGlobalResumed(job: Job<any>) {
    Logger.debug('Queue resumed (global)  [MapsConsumer]');
  }
}
