import { QueueJob, QueueJobDocument } from '@schemas/queueJob.schema';
import { QueueJobStatus } from './../../../common/types/queue.type';
import { OrganizationService } from '@modules/organization/organization.service';
import { RestaurantService } from '@modules/restaurant/restaurant.service';
import { Restaurant, RestaurantDocument } from '@schemas/restaurant.schema';
import { GoogleMapsService } from '@modules/services/google-maps/google-maps.service';
import {
  QueueMapsPayload,
  Queues,
  SuccessJob,
  FailureJob,
  QueueMapsOperation,
} from '@common/types/queue.type';
import {
  OnGlobalQueuePaused,
  OnGlobalQueueResumed,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QueueJobService } from '@modules/services/queue-job/queue-job.service';

@Processor(Queues.MapsQueue)
export class MapsConsumer {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly restaurantService: RestaurantService,
    private readonly googleMapsService: GoogleMapsService,
    private readonly queueJobService: QueueJobService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  @Process()
  async transcode(job: Job<QueueMapsPayload>) {
    const { operation, operationId } = job.data;
    const queueJob = await this.queueJobService.findJobById(job.data.operationId);

    try {
      switch (operation) {
        case QueueMapsOperation.GetOrganizationRestaurants:
          return await this.retriveOrganizationRestaurants(job as any, queueJob);
        default:
          throw new Error(`Operation ${operation} not supported`);
      }
    } catch (err) {
      return this.queueJobService.handleJobCompletion(queueJob, QueueJobStatus.Failed, err);
    }
  }

  async retriveOrganizationRestaurants(
    job: Job<QueueMapsPayload<QueueMapsOperation.GetOrganizationRestaurants>>,
    queueJob: QueueJobDocument,
  ) {
    const { organizationId } = job.data.params;
    const organization = await this.organizationService.findOne({ _id: organizationId });

    const nearbyRestaurants = await this.googleMapsService.getRestaurantsNearby(
      organization.coordinates,
    );
    await this.restaurantService.createOrganizationRestaurants(organizationId, nearbyRestaurants);
    return this.queueJobService.handleJobCompletion(queueJob, QueueJobStatus.Completed);
  }

  @OnQueueActive()
  onActive(job: Job) {
    Logger.debug(
      `Processing job ${job.id} of type MapsConsumer. Data: ${JSON.stringify(job.data)}`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    Logger.debug(`Completed job ${job.id} of type MapsConsumer. Result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    Logger.error(`Failed job ${job.id} of type MapsConsumer: ${error.message}`, error.stack);
  }

  @OnGlobalQueuePaused()
  onGlobalPaused() {
    Logger.debug('Queue paused (global) [MapsConsumer]');
  }

  @OnGlobalQueueResumed()
  onGlobalResumed(job: Job<any>) {
    Logger.debug('Queue resumed (global)  [MapsConsumer]');
  }
}
