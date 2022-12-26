import { CreateGroupDto } from './create-group.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateGroupPollDto extends CreateGroupDto {
  @ApiProperty()
  @IsString()
  voteDeadline: string;

  @ApiProperty()
  @IsString({ each: true })
  allowedRestaurants?: string[];
}
