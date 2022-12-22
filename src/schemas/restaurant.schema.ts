import { RestaurantReviews } from '@common/types/restaurant';
import { Coordinates } from '@common/types/address';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { Address } from '@common/types/address';
import { Organization } from './oraganization.schema';
import { RestaurantPhotos } from '@common/types/restaurant';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop()
  name: string;

  @Prop({ type: Coordinates })
  coordinates: Coordinates;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' })
  organization: Organization;

  @Prop([{ type: RestaurantPhotos }])
  photos: RestaurantPhotos[];

  @Prop()
  priceLevel: number;

  @Prop({ type: Address })
  address?: Address;

  @Prop()
  openingHours: string[];

  @Prop({ type: RestaurantReviews })
  reviews: RestaurantReviews;

  @Prop()
  website?: string;

  @Prop()
  phoneNumber?: string;
}

const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

RestaurantSchema.plugin(aggregatePaginate);

export { RestaurantSchema };
