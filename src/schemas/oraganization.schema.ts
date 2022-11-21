import { Coordinates } from './../common/types/address';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { Address } from '@common/types/address';
import { LunchGroup } from './lunchGroup.schema';
import { Restaurant } from './restaurant.schema';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop()
  name: string;

  @Prop({ type: Address })
  address: Address;

  @Prop({ type: Coordinates })
  coordinates: Coordinates;

  lunchGroups: LunchGroup[];

  restaurants: Restaurant[];
}

const OrganizationSchema = SchemaFactory.createForClass(Organization);

OrganizationSchema.virtual('lunchGroups', {
  ref: 'LunchGroup',
  localField: '_id',
  foreignField: 'organization',
});

OrganizationSchema.virtual('restaurants', {
  ref: 'Restaurant',
  localField: '_id',
  foreignField: 'organization',
});

export { OrganizationSchema };
