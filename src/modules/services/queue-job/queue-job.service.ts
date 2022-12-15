import { QueueJobStatus } from '@common/types/queue.type';
import { Queues } from '@common/types/queue.type';
import { QueueJob, QueueJobDocument } from '@schemas/queueJob.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';

@Injectable()
export class QueueJobService {
  constructor(@InjectModel(QueueJob.name) private readonly queueJob: Model<QueueJob>) {}

  find(filter?: FilterQuery<QueueJobDocument>, populate?: PopulateQuery) {
    return this.queueJob.find(filter ?? {}).populate(populate ?? ('' as any));
  }

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
