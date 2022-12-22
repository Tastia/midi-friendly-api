import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { Organization } from './oraganization.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { InvitationUsage } from '@common/types/auth';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
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

  isExpired: boolean;
}

const InvitationSchema = SchemaFactory.createForClass(Invitation);

InvitationSchema.virtual('isExpired').get(function () {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const target = new Date(new Date(this.expireAt).setHours(0, 0, 0, 0));

  return target.toISOString() < today.toISOString();
});

InvitationSchema.plugin(aggregatePaginate);

export { InvitationSchema };
