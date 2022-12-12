import { LunchGroupStatus } from '@common/types/lunchGroup';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LunchGroupDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ enum: LunchGroupStatus })
  status: 'open' | 'closed';

  @ApiProperty()
  meetingTime: string;

  @ApiPropertyOptional()
  userSlots: number;

  @ApiProperty()
  restaurant: string;

  @ApiProperty()
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
