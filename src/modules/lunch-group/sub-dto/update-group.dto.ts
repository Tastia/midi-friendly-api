import { ApiProperty } from '@nestjs/swagger';
import { AddGroupDto } from './add-group.dto';

export class UpdateGroupDto extends AddGroupDto {
  @ApiProperty()
  groupId: string;
}
