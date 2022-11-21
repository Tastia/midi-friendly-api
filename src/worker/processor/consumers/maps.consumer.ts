import { SuccessJob } from '@common/types/queue.type';
import { Restaurant, RestaurantDocument } from '@schemas/restaurant.schema';
import { GoogleMapsService } from '@modules/services/google-maps/google-maps.service';
import { QueueMapsPayload, Queues } from '@common/types/queue.type';
import { Process, Processor } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { Logger, LoggerService } from '@nestjs/common';

@Processor(Queues.MapsQueue)
export class MapsConsumer {
  constructor(
    private readonly googleMapsService: GoogleMapsService,
    private readonly loggerService: LoggerService,
    @InjectModel(Restaurant.name) private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  @Process()
  async transcode(job: Job<QueueMapsPayload>) {
    Logger.debug(JSON.stringify(job.data), 'MapsQueue Consumer');

    return SuccessJob;
  }
}
