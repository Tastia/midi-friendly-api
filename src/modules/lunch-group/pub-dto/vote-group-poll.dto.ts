import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoteGroupPollDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  pollId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;
}
