import { GroupDto } from './group.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class UpdatedGroupData extends PartialType(GroupDto) {}

export class UpdateGroupDto {
  @ApiProperty()
  @IsString()
  groupId: string;

  @ApiProperty()
  @IsObject()
  groupData: UpdatedGroupData;
}
