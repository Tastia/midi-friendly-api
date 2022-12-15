import { Organization, OrganizationDocument } from '@schemas/oraganization.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class FiltersService {
  constructor(
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  getOrganizations() {
    return this.organizationModel.find({}, '_id name');
  }
}
