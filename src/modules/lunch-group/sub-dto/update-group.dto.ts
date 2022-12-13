import { ApiProperty } from '@nestjs/swagger';
import { LunchGroupDto } from '../dto/lunch-group.dto';

export class UpdateGroupDto {
  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupData: LunchGroupDto;
}
