import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { User } from './user.schema';
import { Organization } from './oraganization.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { InvitationUsage } from '@common/types/invitation';

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true })
export class Invitation {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  type: 'link' | 'email';

  @Prop()
  targetApp: 'client' | 'admin';

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' })
  organization?: Organization;

  @Prop({ required: true })
  expireAt: Date;

  @Prop()
  maxUsage?: number;

  @Prop()
  emails?: string[];

  @Prop([{ type: InvitationUsage }])
  usage: InvitationUsage[];
}

const InvitationSchema = SchemaFactory.createForClass(Invitation);

export { InvitationSchema };
