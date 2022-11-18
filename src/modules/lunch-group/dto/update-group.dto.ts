import { GroupDto } from './group.dto';
import { PartialType } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class UpdatedGroupData extends PartialType(GroupDto) {}

export class UpdateGroupDto {
  @IsString()
  groupId: string;

  @IsObject()
  groupData: UpdatedGroupData;
}
