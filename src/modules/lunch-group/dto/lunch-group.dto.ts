import { LunchGroupStatus } from '@common/types/lunchGroup';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class LunchGroupDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ enum: LunchGroupStatus })
  @IsString()
  status: 'open' | 'closed';

  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  meetingTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  userSlots: number;

  @ApiProperty()
  @IsString()
  restaurant: string;

  @ApiProperty()
  @IsString()
  organization: string;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  users: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
