import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GroupDto {
  @IsOptional()
  @IsNumber()
  userSlots?: number;

  @IsString()
  meetingTime: string;

  @IsString()
  restaurant: string;
}
