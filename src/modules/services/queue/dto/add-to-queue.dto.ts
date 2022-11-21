import { IsId } from '@common/decorators/is-mongoose-id.decorator';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Queues } from '@common/types/queue.type';

class QueueJobData {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  operation: string;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  params: Record<string, any>;
}

export class AddToQueueDto {
  @ApiProperty({
    description: 'Queue to add message',
    enum: [Queues.MapsQueue, Queues.MailQueue],
  })
  @IsNotEmpty()
  @IsEnum(Queues)
  readonly queueName: Queues;

  @IsObject()
  @ApiProperty({
    description: 'Data to add to queue',
  })
  readonly jobData: QueueJobData;
}
