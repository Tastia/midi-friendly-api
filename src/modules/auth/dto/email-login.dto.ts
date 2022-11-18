import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * Login Data transfer object
 */
export class EmailLoginDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  readonly password: string;
}
