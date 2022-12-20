import { Organization } from './oraganization.schema';
import { Restaurant } from './restaurant.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { User } from './user.schema';
import { LunchGroupStatus } from '@common/types/lunchGroup';

export type LunchGroupDocument = LunchGroup & Document;

@Schema({ timestamps: true })
export class LunchGroup {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop()
  label: string;

  @Prop()
  description?: string;

  @Prop({ default: LunchGroupStatus.open })
  status: 'open' | 'closed';

  @Prop()
  meetingTime?: string;

  @Prop()
  userSlots?: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' })
  restaurant: Restaurant;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' })
  organization: Organization;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  users: User[];
}

export const LunchGroupSchema = SchemaFactory.createForClass(LunchGroup);
