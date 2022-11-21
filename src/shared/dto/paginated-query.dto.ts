import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { PaginationDto } from '@modules/shared/dto/pagination.dto';
import { Field, Query, QuickQuery } from '@modules/shared/search/search.service';

export class PaginatedQuery extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Offset - use offset or page to skip positions',
  })
  readonly query?: Query;

  readonly searchQuery?: QuickQuery;

  readonly select?: Field[];
}
