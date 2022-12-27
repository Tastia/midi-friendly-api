import { RestaurantDocument, Restaurant } from '@schemas/restaurant.schema';
import { Organization, OrganizationDocument } from '@schemas/oraganization.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class FiltersService {
  constructor(
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  getOrganizations() {
    return this.organizationModel.find({}, '_id name');
  }

  getRestaurants(organization?: Organization) {
    return this.restaurantModel.find(
      organization ? { organization: organization._id } : {},
      '_id name',
    );
  }
}
