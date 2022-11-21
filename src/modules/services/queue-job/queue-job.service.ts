import { QueueJobStatus } from '@common/types/queue.type';
import { Queues } from '@common/types/queue.type';
import { QueueJob, QueueJobDocument } from '@schemas/queueJob.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class QueueJobService {
  constructor(@InjectModel(QueueJob.name) private readonly queueJob: Model<QueueJob>) {}

  findJobById(id: string) {
    return this.queueJob.findById(id);
  }

  async createQueueJob(queueJob: {
    queue: Queues;
    operation: string;
    params: Record<string, any>;
  }) {
    return this.queueJob.create({
      queue: queueJob.queue,
      operation: queueJob.operation,
      params: queueJob.params,
    });
  }

  async handleJobCompletion(queueJob: QueueJobDocument, status: QueueJobStatus, output: any = {}) {
    queueJob.status = status;
    queueJob.attempts += 1;
    queueJob.result = output;
    return await queueJob.save();
  }
}
