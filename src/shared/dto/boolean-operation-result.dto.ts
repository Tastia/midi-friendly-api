import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class BooleanOperationResult {
  @ApiProperty({ example: 'true' })
  @IsNotEmpty()
  @IsBoolean()
  readonly success: boolean;
}
