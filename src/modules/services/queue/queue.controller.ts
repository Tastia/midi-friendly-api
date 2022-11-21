import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Logger,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { Queues } from '@common/types/queue.type';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { QueueStatusDto } from './dto/queue-status.dto';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { BooleanOperationResult } from '@shared/dto/boolean-operation-result.dto';

@Injectable()
@Controller('queue')
@ApiTags('Queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('pause/:queueName')
  @ApiOperation({
    summary: 'Pause a queue',
    description: 'Pause a queue',
  })
  @ApiOkResponse({
    description: 'Success',
    type: BooleanOperationResult,
    isArray: false,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth('JWT')
  async pause(@Param('queueName') queueName: string): Promise<BooleanOperationResult> {
    try {
      if (!(<any>Object).values(Queues).includes(queueName)) {
        throw new BadRequestException(`Unknown queue name: '${queueName}'`);
      }
      const queue = queueName as Queues;
      Logger.debug(`Pausing ${queue}`);
      return this.queueService.pause(queue);
    } catch (e) {
      Logger.error(e);
      throw e;
    }
  }

  @Post('resume/:queueName')
  @ApiOperation({
    summary: 'Resume a queue',
    description: 'Resumes a queue',
  })
  @ApiOkResponse({
    description: 'Success',
    type: BooleanOperationResult,
    isArray: false,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth('JWT')
  async resume(@Param('queueName') queueName: string): Promise<BooleanOperationResult> {
    try {
      if (!(<any>Object).values(Queues).includes(queueName)) {
        throw new BadRequestException(`Unknown queue name: '${queueName}'`);
      }
      const queue = queueName as Queues;
      Logger.debug(`Resuming ${queue}`);
      return this.queueService.resume(queue);
    } catch (e) {
      Logger.error(e);
      throw e;
    }
  }

  @Post('clear/:queueName')
  @ApiOperation({
    summary: 'Clear queue',
    description: 'Remove all jobs and data from the queue',
  })
  @ApiOkResponse({
    description: 'Success',
    type: BooleanOperationResult,
    isArray: false,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth('JWT')
  async clear(@Param('queueName') queueName: string): Promise<BooleanOperationResult> {
    try {
      if (!(<any>Object).values(Queues).includes(queueName)) {
        throw new BadRequestException(`Unknown queue name: '${queueName}'`);
      }
      const queue = queueName as Queues;
      Logger.debug(`Clearing ${queue}`);
      return this.queueService.clear(queue);
    } catch (e) {
      Logger.error(e);
      throw e;
    }
  }

  @Get('status/:queueName')
  @ApiOperation({
    summary: 'Get queue status',
    description: 'Returns queue status and information about the jobs',
  })
  @ApiOkResponse({
    description: 'Queue status',
    type: QueueStatusDto,
    isArray: false,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth('JWT')
  async getStatus(@Param('queueName') queueName: string): Promise<QueueStatusDto> {
    try {
      if (!(<any>Object).values(Queues).includes(queueName)) {
        throw new BadRequestException(`Unknown queue name: '${queueName}'`);
      }
      const queue = queueName as Queues;
      return this.queueService.getStatus(queue);
    } catch (e) {
      Logger.error(e);
      throw e;
    }
  }

  @Post('add')
  @ApiOperation({
    summary: 'Add assessment',
    description: 'Add assessment to the queue',
  })
  @ApiOkResponse({
    description: 'Success',
    type: BooleanOperationResult,
    isArray: false,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth('JWT')
  // @Policy('admin.processingQueues.update')
  async add(
    @Body(new ValidationPipe({ transform: true })) params: AddToQueueDto,
  ): Promise<BooleanOperationResult> {
    try {
      if (!(<any>Object).values(Queues).includes(params.queueName)) {
        throw new BadRequestException(`Unknown queue name: '${params.queueName}'`);
      }
      const queue = params.queueName as Queues;
      Logger.debug(`Adding to queue ${queue}`);
      return this.queueService.add(params);
    } catch (e) {
      Logger.error(e);
      throw e;
    }
  }
}
