import { QueueJobService } from '@modules/services/queue-job/queue-job.service';
import { Controller, Get } from '@nestjs/common';

@Controller('queue-jobs')
export class QueueJobController {
  constructor(private readonly queueJobService: QueueJobService) {}

  @Get('')
  findAllJobs() {
    return this.queueJobService.find();
  }
}
