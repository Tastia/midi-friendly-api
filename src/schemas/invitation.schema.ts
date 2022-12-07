import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { User } from './user.schema';
import { Organization } from './oraganization.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true })
export class Invitation {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ default: 1 })
  maxUsage: number;

  @Prop({ default: 0 })
  currentUsage: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' })
  organization?: Organization;

  @Prop({ required: true })
  targetApp: 'client' | 'admin';

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  registeredUsers: User[];

  @Prop({ required: true })
  expiracy: Date;
}

const InvitationSchema = SchemaFactory.createForClass(Invitation);

export { InvitationSchema };
