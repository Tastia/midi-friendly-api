import { Restaurant } from '@schemas/restaurant.schema';
import { Organization } from './oraganization.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { User } from './user.schema';
import { LunchGroupPollEntries, LunchGroupStatus } from '@common/types/lunchGroup';
import { LunchGroup } from './lunchGroup.schema';
import { ChatRoom } from './chatRoom.schema';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type LunchGroupPollDocument = LunchGroupPoll & Document;

@Schema({ timestamps: true })
export class LunchGroupPoll {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ enum: LunchGroupStatus, default: LunchGroupStatus.open })
  status: LunchGroupStatus;

  @Prop()
  label: string;

  @Prop()
  description?: string;

  @Prop()
  voteDeadline: string;

  @Prop()
  meetingTime: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }])
  allowedRestaurants?: Restaurant[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' })
  organization: Organization;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;

  @Prop([{ type: LunchGroupPollEntries }])
  votes: LunchGroupPollEntries[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LunchGroup' })
  lunchGroup?: LunchGroup;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' })
  chatRoom: ChatRoom;
}

const LunchGroupPollSchema = SchemaFactory.createForClass(LunchGroupPoll);

LunchGroupPollSchema.plugin(aggregatePaginate);

export { LunchGroupPollSchema };
