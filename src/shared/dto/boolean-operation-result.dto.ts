import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Assessment } from '@schemas/assesment.schema';
import { BlankAssessment } from '@schemas/blank-assesment.schema';

export class BooleanOperationResult {
  @ApiProperty({ example: 'true' })
  @IsNotEmpty()
  @IsBoolean()
  readonly success: boolean;
}
