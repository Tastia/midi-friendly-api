import { User } from '@schemas/user.schema';
import { Prop } from '@nestjs/mongoose';
import { Address, Coordinates } from './address';
import mongoose from 'mongoose';
import { Schema } from '@nestjs/mongoose';

export interface BaseRestaurant {
  name: string;
  placeId: string;
  address: Address;
  coordinates: Coordinates;
  gMapsReviews: GoogleRestaurantRating[];
  photos: RestaurantPhotos[];
  priceLevel: number;
  openingHours: string[];
  website: string;
  phoneNumber: string;
}

export class RestaurantPhotos {
  @Prop()
  reference: string;

  @Prop()
  width: number;

  @Prop()
  height: number;
}

export class GoogleRestaurantRating {
  @Prop()
  authorName: string;

  @Prop()
  authorPhoto: string;

  @Prop()
  rating: number;

  @Prop()
  text: string;

  @Prop()
  createdAt: string;
}

@Schema({ timestamps: true })
export class InternalRestaurantRating {
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  user: User;

  @Prop()
  rating: number;

  @Prop()
  text: string;
}

export class RestaurantReviews {
  @Prop({ type: [GoogleRestaurantRating] })
  google: GoogleRestaurantRating[];

  @Prop({ type: [InternalRestaurantRating] })
  internal: InternalRestaurantRating[];
}
