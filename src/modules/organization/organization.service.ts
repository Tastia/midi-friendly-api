import { RestaurantService } from '@modules/restaurant/restaurant.service';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Organization, OrganizationDocument } from '@schemas/oraganization.schema';
import { GoogleMapsService } from '@modules/services/google-maps/google-maps.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    private readonly restaurantService: RestaurantService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  find(filter?: FilterQuery<OrganizationDocument>, populate?: PopulateQuery) {
    return this.organizationModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  findOne(filter?: FilterQuery<OrganizationDocument>, populate?: PopulateQuery) {
    return this.organizationModel.findOne(filter ?? {}).populate(populate ?? ('' as any));
  }

  async create(newOrganization: CreateOrganizationDto) {
    const coordinates = await this.googleMapsService.getCoordinatesFromAddress(
      newOrganization.address,
    );

    if (!coordinates) throw new NotFoundException('Coordinates for given address not found');
    const nearbyRestaurants = await this.googleMapsService.getRestaurantsNearby(coordinates);

    const organization = await this.organizationModel.create({
      name: newOrganization.name,
      address: newOrganization.address,
      coordinates,
    });
    const registeredRestaurants = await this.restaurantService.createOrganizationRestaurants(
      organization._id.toString(),
      nearbyRestaurants,
    );

    return {
      ...organization,
      restaurants: registeredRestaurants,
    };
  }
}
