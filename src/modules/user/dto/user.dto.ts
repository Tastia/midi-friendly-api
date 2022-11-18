import { IsEmail, IsString, MinLength } from 'class-validator';

export class UserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  organization: string;
}
