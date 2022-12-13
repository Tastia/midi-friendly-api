import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../dto/user.dto';

export class UserConnectedDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;
}
