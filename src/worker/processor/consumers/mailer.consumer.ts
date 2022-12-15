import { QueueJobDocument } from '@schemas/queueJob.schema';
import { QueueEmailsOperation, QueueJobStatus } from '@common/types/queue.type';
import { User, UserDocument } from '@schemas/user.schema';
import { QueueMailPayload } from '@common/types/queue.type';
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
import { QueueJobService } from '@modules/services/queue-job/queue-job.service';
import { rateLimitPromiseQueue } from '@shared/utils/rate-limit-promise-queue';
import { MailerService } from '@modules/mailer/mailer.service';

@Processor(Queues.MailQueue)
export class MailerConsumer {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly queueJobService: QueueJobService,
    private readonly mailerService: MailerService,
  ) {}

  @Process()
  async transcode(job: Job<QueueMailPayload>) {
    const { operation, operationId } = job.data;
    const queueJob = await this.queueJobService.findJobById(operationId);

    try {
      switch (operation) {
        case QueueEmailsOperation.InviteUser:
          return await this.sendInvitationEmail(job as any, queueJob);
        default:
          throw new Error(`Operation ${operation} not supported`);
      }
    } catch (err) {
      return this.queueJobService.handleJobCompletion(queueJob, QueueJobStatus.Failed, err);
    }
  }

  async sendInvitationEmail(
    job: Job<QueueMailPayload<QueueEmailsOperation.InviteUser>>,
    queueJob: QueueJobDocument,
  ) {
    await rateLimitPromiseQueue(
      job.data.params.map((email) => () => this.mailerService.sendInvitationEmail(email)),
      {
        concurrency: 1,
        interval: 1100,
        runsPerInterval: 1,
      },
    );
    return this.queueJobService.handleJobCompletion(queueJob, QueueJobStatus.Completed);
  }

  @OnQueueActive()
  onActive(job: Job) {
    Logger.debug(
      `Processing job ${job.id} of type MailConsumer. Data: ${JSON.stringify(job.data, null, 2)}`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    Logger.debug(
      `Completed job ${job.id} of type MailConsumer. Result: ${JSON.stringify(result, null, 2)}`,
    );
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    Logger.error(`Failed job ${job.id} of type MailConsumer: ${error.message}`, error.stack);
  }

  @OnGlobalQueuePaused()
  onGlobalPaused() {
    Logger.debug('Queue paused (global) [MailConsumer]');
  }

  @OnGlobalQueueResumed()
  onGlobalResumed(job: Job<any>) {
    Logger.debug('Queue resumed (global)  [MailConsumer]');
  }
}
