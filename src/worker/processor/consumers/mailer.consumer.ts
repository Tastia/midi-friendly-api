import { User, UserDocument } from '@schemas/user.schema';
import { QueueMailPayload, SuccessJob } from '@common/types/queue.type';
import { Queues } from '@common/types/queue.type';
import { Process, Processor } from '@nestjs/bull';
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
}
