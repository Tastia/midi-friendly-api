import { BadRequestException, Injectable } from '@nestjs/common';
import { Queues } from '@common/types/queue.type';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { QueueStatusDto } from './dto/queue-status.dto';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { BooleanOperationResult } from '@shared/dto/boolean-operation-result.dto';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(Queues.MapsQueue) private mapsQueue: Queue,
    @InjectQueue(Queues.MailQueue) private mailQueue: Queue,
  ) {}

  /**
   * Start paused queue
   * @param queueName
   */
  async resume(queueName: Queues): Promise<BooleanOperationResult> {
    await this.getQueue(queueName).resume(false);
    return { success: true };
  }

  /**
   * Stop/Pause given queue
   * @param queueName
   */
  async pause(queueName: Queues): Promise<BooleanOperationResult> {
    await this.getQueue(queueName).pause(false);
    return { success: true };
  }

  /**
   * Clear all jobs from a given queue
   * @param queueName
   */
  async clear(queueName: Queues): Promise<BooleanOperationResult> {
    await this.getQueue(queueName).empty();
    return { success: true };
  }

  /**
   * Get queue by name
   * @param queueName
   * @private
   */
  private getQueue(queueName: Queues): Queue {
    switch (queueName) {
      case Queues.MapsQueue:
        return this.mapsQueue;
      case Queues.MailQueue:
        return this.mailQueue;
    }
  }

  /**
   * get Que status given queue
   * @param queueName
   */
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

  /**
   * Add assessment to the queue
   * @param data
   */
  async add(data: AddToQueueDto) {
    const queue = await this.getQueue(data.queueName);
    if (!queue) throw new BadRequestException('Unknown queue ' + data.queueName);

    // VALIDATE PAYLOAD, INJECT IT PROPERLY

    const param = {};
    return queue.add(param) as unknown as Promise<BooleanOperationResult>;
  }
}
