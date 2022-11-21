import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CountQuery {
  @ApiPropertyOptional({
    description: 'Count values only',
    default: false,
  })
  @IsOptional()
  readonly count?: boolean;
}
