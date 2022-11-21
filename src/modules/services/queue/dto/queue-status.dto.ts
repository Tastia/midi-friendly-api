import { ApiProperty } from '@nestjs/swagger';

export class QueueStatusDto {
  @ApiProperty({ example: 'false', description: 'Is the queue paused?' })
  readonly isPaused: boolean;

  @ApiProperty({
    example: '0',
    description: 'Amount of waiting jobs in the queue',
  })
  readonly waiting: number;

  @ApiProperty({
    example: '2',
    description: 'Amount of active jobs in the queue',
  })
  readonly active: number;

  @ApiProperty({
    example: '97',
    description: 'Amount of completed jobs in the queue',
  })
  readonly completed: number;

  @ApiProperty({
    example: '2',
    description: 'Amount of failed jobs in the queue',
  })
  readonly failed: number;

  @ApiProperty({
    example: '14',
    description: 'Amount of delayed jobs in the queue',
  })
  readonly delayed: number;

  @ApiProperty({
    example: '0',
    description: 'Amount of paused jobs in the queue',
  })
  readonly paused: number;
}
