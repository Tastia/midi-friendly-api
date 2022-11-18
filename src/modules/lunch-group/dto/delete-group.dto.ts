import { IsString } from 'class-validator';

export class DeleteGroupDto {
  @IsString()
  groupId: string;
}
