import { InvitationTargetApp } from '@common/types/auth';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsDateString, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateInvitationLinkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty()
  @IsDateString()
  expireAt: string;

  @ApiProperty()
  @IsNumber()
  maxUsage: number;

  @ApiProperty()
  @IsEnum(InvitationTargetApp)
  targetApp: InvitationTargetApp;
}
