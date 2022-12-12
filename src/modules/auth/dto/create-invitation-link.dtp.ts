import { InvitationTargetApp } from '@common/types/invitation';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsString, IsNumber, IsEnum } from 'class-validator';

export class CreateInvitationLinkDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

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
