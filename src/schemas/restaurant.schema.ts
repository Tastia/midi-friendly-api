import { Coordinates } from './../common/types/address';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { Address } from '@common/types/address';
import { Organization } from './oraganization.schema';

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop()
  name: string;

  @Prop({ type: Address })
  address: Address;

  @Prop({ type: Coordinates })
  coordinates: Coordinates;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' })
  organization: Organization;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
