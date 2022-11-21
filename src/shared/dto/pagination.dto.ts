import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Offset - use offset or page to skip positions',
  })
  readonly offset?: number;

  @ApiPropertyOptional({
    description: 'Page - use page or offset to skip positions',
  })
  readonly page?: number;

  @ApiPropertyOptional({ description: 'limit', default: 10, example: 10 })
  @IsNotEmpty()
  readonly limit: number = 10;

  @ApiPropertyOptional({ description: 'sort key', example: 'firstName' })
  @IsOptional()
  readonly sortKey?: string;

  @ApiPropertyOptional({ description: 'sort order', example: 'asc' })
  @IsOptional()
  readonly sortOrder?: string;
}
