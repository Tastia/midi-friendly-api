import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AccessGroupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
