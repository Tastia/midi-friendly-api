import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { PaginationDto } from '@modules/shared/dto/pagination.dto';
import { Query } from '@modules/shared/search/search.service';
import { from } from 'rxjs';

export class CountQuery {
  @ApiPropertyOptional({
    description: 'Count values only',
    default: false,
  })
  @IsOptional()
  readonly count?: boolean;
}
