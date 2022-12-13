import { ApiProperty } from '@nestjs/swagger';

export class UserDisconnectedDto {
  @ApiProperty()
  userId: string;
}
