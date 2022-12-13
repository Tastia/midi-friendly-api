import { IsId } from '@common/decorators/is-mongoose-id.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ValidateInvitationDto {
  @ApiProperty()
  @IsString()
  @IsId()
  @IsNotEmpty()
  invitationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? decodeURIComponent(value) : undefined))
  emailHash?: string;
}
