import { IsId } from '@common/decorators/is-mongoose-id.decorator';
import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Queues } from '@common/types/queue.type';

export class AddToQueueDto {
  @ApiProperty({
    description: 'Queue to add message',
    enum: [Queues.AssetQueue, Queues.PdfQueue, Queues.MailQueue, Queues.ScoringQueue, Queues.ProctoringQueue],
  })
  @IsNotEmpty()
  @IsEnum(Queues)
  readonly queueName: Queues;

  @IsId()
  @IsNotEmpty()
  @ApiProperty({ description: 'assessment ID' })
  readonly assessmentId: string;

  @IsId()
  @ApiPropertyOptional({ description: 'testCenter ID' })
  readonly testCenterId?: string;

  @ApiPropertyOptional({
    description: 'Is cancel mode for email',
    default: () => false,
  })
  readonly cancelMode?: boolean;
}
