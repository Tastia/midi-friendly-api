import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../dto/user.dto';

export class SetUserListDto {
  @ApiProperty({ type: [UserDto] })
  users: UserDto[];
}
