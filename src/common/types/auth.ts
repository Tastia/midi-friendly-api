import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prop } from '@nestjs/mongoose';
import { User } from '@schemas/user.schema';
import { Exclude, Transform } from 'class-transformer';
import mongoose from 'mongoose';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export enum InvitationType {
  Link = 'link',
  Email = 'email',
}

export enum InvitationTargetApp {
  Client = 'client',
  Admin = 'admin',
}

export enum AuthProviders {
  Google = 'google',
  Facebook = 'facebook',
  LinkedIn = 'linkedin',
}

export class InvitationUsage {
  @Transform(({ value }) => value.toString())
  @Prop({ required: true })
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  email?: string;

  @Prop()
  usageDate: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  linkedAccount?: User;
}

export class EmailCredentials {
  @Prop()
  type: 'email';

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;
}

export class ProviderCredentials {
  @Prop({ enum: AuthProviders })
  type: AuthProviders;

  @Prop()
  email: string;

  @Prop({ type: String, select: false })
  @Exclude()
  userId: string;
}

export interface AuthPayload {
  type: 'email' | 'google' | 'facebook';
  email: string;
  password?: string;
  userId?: string;
}

export class LinkAccountPayload {
  @ApiProperty()
  @IsString()
  @IsEmail()
  type: `${AuthProviders}` | 'email';

  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}

export class RegisterAccountPayload extends LinkAccountPayload {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}
