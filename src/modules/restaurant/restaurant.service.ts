import { BaseRestaurant } from '@common/types/restaurant';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant, RestaurantDocument } from '@schemas/restaurant.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  createOrganizationRestaurants(organizationId: string, restaurants: BaseRestaurant[]) {
    return Promise.all(
      restaurants.map((restaurant) =>
        this.restaurantModel.create({
          name: restaurant.name,
          pageId: restaurant.placeId,
          coordinates: restaurant.coordinates,
          organization: new Types.ObjectId(organizationId),
          photos: restaurant.photos,
          priceLevel: restaurant.priceLevel,
          reviews: {
            google: restaurant.gMapsReviews,
            internal: [],
          },
          openingHours: restaurant.openingHours,
        }),
      ),
    );
  }
}
