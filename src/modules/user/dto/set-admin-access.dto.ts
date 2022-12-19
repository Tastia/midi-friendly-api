import { IsId } from '@common/decorators/is-mongoose-id.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class SetAdminAccessDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsId()
  userId: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  allowAccess: boolean;
}
