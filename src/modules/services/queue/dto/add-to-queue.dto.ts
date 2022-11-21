import { IsId } from '@common/decorators/is-mongoose-id.decorator';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Queues } from '@common/types/queue.type';

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
  readonly queueParams: { [key: string]: any };
}
