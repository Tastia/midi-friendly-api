import { QueueService } from '@modules/services/queue/queue.service';
import { QueueMapsOperation, QueueMapsPayload, Queues } from '@common/types/queue.type';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Organization, OrganizationDocument } from '@schemas/oraganization.schema';
import { GoogleMapsService } from '@modules/services/google-maps/google-maps.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectQueue(Queues.MapsQueue) private mapsQueue: Queue<QueueMapsPayload>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    private readonly googleMapsService: GoogleMapsService,
    private readonly queueService: QueueService,
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

    const organization = await this.organizationModel.create({
      name: newOrganization.name,
      address: newOrganization.address,
      coordinates,
    });

    this.queueService.add({
      queueName: Queues.MapsQueue,
      jobData: {
        operation: QueueMapsOperation.GetOrganizationRestaurants,
        params: { organizationId: organization._id.toString() },
      },
    });

    return organization;
  }
}
