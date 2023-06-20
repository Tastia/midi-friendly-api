import { BaseRestaurant } from '@common/types/restaurant';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant, RestaurantDocument } from '@schemas/restaurant.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';
import {
  MongooseSearchService,
  PaginatedQuery,
  SearchPaginateModel,
} from '@chronicstone/mongoose-search';
import { GoogleMapsService } from '@modules/services/google-maps/google-maps.service';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Restaurant.name)
    private readonly restaurantPaginatedModel: SearchPaginateModel<RestaurantDocument>,
    private readonly searchService: MongooseSearchService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  createOrganizationRestaurants(organizationId: string, restaurants: BaseRestaurant[]) {
    return Promise.all(
      restaurants.map((restaurant) =>
        this.restaurantModel.create({
          name: restaurant.name,
          placeId: restaurant.placeId,
          coordinates: restaurant.coordinates,
          address: restaurant.address,
          organization: new Types.ObjectId(organizationId),
          photos: restaurant.photos,
          priceLevel: restaurant.priceLevel,
          reviews: {
            google: restaurant.gMapsReviews,
            internal: [],
          },
          openingHours: restaurant.openingHours,
          website: restaurant.website,
          phoneNumber: restaurant.phoneNumber,
          services: restaurant.services,
          types: restaurant.types,
        }),
      ),
    );
  }

  find(filter?: FilterQuery<RestaurantDocument>, populate?: PopulateQuery) {
    return this.restaurantModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  findOne(filter?: FilterQuery<RestaurantDocument>, populate?: PopulateQuery) {
    return this.restaurantModel.findOne(filter ?? {}).populate(populate ?? ('' as any));
  }

  list(query: PaginatedQuery, count: boolean) {
    const lookup = [
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'organization',
        },
      },
      {
        $set: {
          organization: {
            $arrayElemAt: ['$organization', 0],
          },
        },
      },
    ];
    return this.searchService.search(this.restaurantPaginatedModel, query, lookup, count);
  }

  async manuallyInsertRestaurant(organizationId: string, placeId: string) {
    const restaurant = await this.googleMapsService.getRestaurantData(placeId);
    return this.createOrganizationRestaurants(organizationId, [restaurant]);
  }

  async toggleRestaurant(restaurantId: string) {
    const restaurant = await this.restaurantModel.findById(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    restaurant.disabled = !restaurant.disabled;
    restaurant.markModified('disabled');
    return restaurant.save();
  }
}
