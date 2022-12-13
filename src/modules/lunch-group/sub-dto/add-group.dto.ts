import { ApiProperty } from '@nestjs/swagger';
import { LunchGroupDto } from '../dto/lunch-group.dto';

export class AddGroupDto {
  @ApiProperty({ type: LunchGroupDto })
  group: LunchGroupDto;
}
