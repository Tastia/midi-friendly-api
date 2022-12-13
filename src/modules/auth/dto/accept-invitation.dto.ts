import { LinkAccountPayload, RegisterAccountPayload } from '@common/types/auth';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

export class AccountPayload {
  @ApiProperty()
  @IsString()
  mode: 'link' | 'register';

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => LinkAccountPayload)
  linkPayload?: LinkAccountPayload;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterAccountPayload)
  registerPayload?: RegisterAccountPayload;
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  invitationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? decodeURIComponent(value) : undefined))
  emailHash?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => AccountPayload)
  account: AccountPayload;
}
