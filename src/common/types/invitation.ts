import { Prop } from '@nestjs/mongoose';
import { User } from '@schemas/user.schema';
import { Transform } from 'class-transformer';
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
