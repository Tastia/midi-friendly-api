import { LunchGroupDto } from '../dto/lunch-group.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SetLunchGroupListDto {
  @ApiProperty({ type: [LunchGroupDto] })
  groups: LunchGroupDto[];
}
