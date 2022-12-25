import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class PaginateQuery {
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  limit: number;

  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  offset: number;
}
