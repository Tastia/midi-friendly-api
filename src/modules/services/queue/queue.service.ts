import { BadRequestException, Injectable } from '@nestjs/common';
import { Queues, QueuesPayload } from '@common/types/queue.type';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { QueueStatusDto } from './dto/queue-status.dto';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { BooleanOperationResult } from '@shared/dto/boolean-operation-result.dto';
import { QueueJobService } from '../queue-job/queue-job.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(Queues.MapsQueue) private mapsQueue: Queue,
    @InjectQueue(Queues.MailQueue) private mailQueue: Queue,
    private readonly queueJobService: QueueJobService,
  ) {}

  async resume(queueName: Queues): Promise<BooleanOperationResult> {
    await this.getQueue(queueName).resume(false);
    return { success: true };
  }

  async pause(queueName: Queues): Promise<BooleanOperationResult> {
    await this.getQueue(queueName).pause(false);
    return { success: true };
  }

  async clear(queueName: Queues): Promise<BooleanOperationResult> {
    await this.getQueue(queueName).empty();
    return { success: true };
  }

  private getQueue(queueName: Queues): Queue {
    switch (queueName) {
      case Queues.MapsQueue:
        return this.mapsQueue;
      case Queues.MailQueue:
        return this.mailQueue;
    }
  }

  async getStatus(queueName: Queues): Promise<QueueStatusDto> {
    const test = await this.getQueue(queueName).isPaused();
    const queue = await this.getQueue(queueName);
    const isPaused = await queue.isPaused();
    const jobCounts = await queue.getJobCounts();
    return {
      isPaused,
      ...jobCounts,
    } as QueueStatusDto;
  }

  async add<T extends Queues>(data: {
    queueName: T;
    jobData: Omit<QueuesPayload<T>, 'operationId'>;
  }) {
    const { queueName, jobData } = data;
    const queue = await this.getQueue(queueName);
    if (!queue) throw new BadRequestException('Unknown queue ' + queueName);

    const queueJob = await this.queueJobService.createQueueJob({
      queue: queueName,
      operation: jobData.operation,
      params: jobData.params,
    });

    const param = { ...jobData, operationId: queueJob._id.toString() };
    return queue.add(param) as unknown as Promise<BooleanOperationResult>;
  }
}
