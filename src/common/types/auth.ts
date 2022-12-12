import { Prop } from '@nestjs/mongoose';
import { User } from '@schemas/user.schema';
import { Exclude, Transform } from 'class-transformer';
import mongoose from 'mongoose';

export enum InvitationType {
  Link = 'link',
  Email = 'email',
}

export enum InvitationTargetApp {
  Client = 'client',
  Admin = 'admin',
}

export class InvitationUsage {
  @Transform(({ value }) => value.toString())
  @Prop({ required: true, default: () => new mongoose.Types.ObjectId() })
  _id: string;

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

export class GoogleCredentials {
  @Prop()
  type: 'google';

  @Prop()
  email: string;

  @Prop({ type: String, select: false })
  @Exclude()
  userId: string;
}

export class FacebookCredentials {
  @Prop()
  type: 'facebook';

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
