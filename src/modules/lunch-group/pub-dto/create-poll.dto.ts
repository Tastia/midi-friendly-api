import { CreateGroupDto } from './create-group.dto';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupPollDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  userSlots?: number;

  @ApiProperty()
  @IsString()
  meetingTime: string;

  @ApiProperty()
  @IsString()
  voteDeadline: string;

  @ApiProperty()
  @IsString({ each: true })
  allowedRestaurants?: string[];

  @ApiProperty()
  @IsString()
  userVote: string;
}
