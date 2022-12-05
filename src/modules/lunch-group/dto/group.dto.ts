import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GroupDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  userSlots?: number;

  @ApiProperty()
  @IsString()
  meetingTime: string;

  @ApiProperty()
  @IsString()
  restaurant: string;
}
