import { Injectable } from '@nestjs/common';
import { BullModuleOptions, SharedBullConfigurationFactory } from '@nestjs/bull';
import * as Bull from 'bull';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BullConfigService implements SharedBullConfigurationFactory {
  constructor(private readonly configService: ConfigService) {}

  createSharedConfiguration(): Promise<Bull.QueueOptions> | Bull.QueueOptions {
    return {
      redis: {
        host: this.configService.get<string>('bull.host'),
        port: +this.configService.get<number>('bull.port'),
      },
    };
  }
}
